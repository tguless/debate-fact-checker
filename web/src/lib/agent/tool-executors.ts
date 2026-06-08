import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { ClaimVerdict, Prisma, RhetoricTechnique } from "@prisma/client";
import { analyzeTranscript } from "@/lib/rhetoric/analyzer";
import { prisma } from "@/lib/prisma";
import {
  indexTranscriptForRag,
  searchTranscriptRag,
} from "@/lib/rag/transcript-rag";
import {
  buildFullText,
  estimateDurationSeconds,
  fetchVideoTitle,
  getTranscript,
  type TranscriptSegment,
} from "@/lib/youtube";
import { readUrl, searchWeb } from "./web-search";

export type ToolContext = {
  analysisId: string;
  videoId: string;
  segments: TranscriptSegment[];
  fullText: string;
};

/** Cursor Agent Skills format — https://cursor.com/docs */
async function resolveSkillPath(): Promise<string> {
  if (process.env.AGENT_SKILL_PATH?.trim()) {
    return process.env.AGENT_SKILL_PATH.trim();
  }

  const candidates = [
    path.join(process.cwd(), "skills", "debate-fact-check", "SKILL.md"),
    path.join(process.cwd(), "..", ".cursor", "skills", "debate-fact-check", "SKILL.md"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next path (dev vs Docker layout)
    }
  }

  throw new Error(`Agent skill not found. Tried: ${candidates.join(", ")}`);
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  switch (name) {
    case "read_skill": {
      const skillPath = await resolveSkillPath();
      const content = await readFile(skillPath, "utf-8");
      return { skill: content, format: "cursor-agent-skill", path: skillPath };
    }

    case "fetch_transcript": {
      let transcriptLang = "cached";
      if (ctx.segments.length === 0) {
        const fetched = await getTranscript(ctx.videoId);
        ctx.segments = fetched.segments;
        transcriptLang = fetched.lang;
      }
      const segments = ctx.segments;
      ctx.fullText = buildFullText(segments);
      const durationSeconds = estimateDurationSeconds(segments);
      const title = await fetchVideoTitle(ctx.videoId);

      await prisma.transcriptSegment.deleteMany({ where: { analysisId: ctx.analysisId } });
      await prisma.transcriptSegment.createMany({
        data: segments.map((segment) => ({
          analysisId: ctx.analysisId,
          index: segment.index,
          startMs: segment.startMs,
          durationMs: segment.durationMs,
          text: segment.text,
          timestamp: segment.timestamp,
        })),
      });

      const rag = await indexTranscriptForRag(ctx.analysisId, segments);

      await prisma.analysis.update({
        where: { id: ctx.analysisId },
        data: {
          title,
          fullText: ctx.fullText,
          segmentCount: segments.length,
          durationSeconds,
        },
      });

      return {
        segmentCount: segments.length,
        durationSeconds,
        durationMinutes: Math.round(durationSeconds / 60),
        ragChunks: rag.chunkCount,
        transcriptLang,
        title,
        preview: segments
          .slice(0, 12)
          .map((s) => `[${s.timestamp}] ${s.text}`)
          .join("\n"),
        note: `Transcript indexed for LangChain RAG (${transcriptLang}). Use search_transcript_rag for semantic retrieval.`,
      };
    }

    case "search_transcript_rag": {
      const query = String(args.query ?? "");
      if (!query) throw new Error("search_transcript_rag requires a query");
      const results = await searchTranscriptRag(ctx.analysisId, query, Number(args.limit ?? 6));
      return { query, results, framework: "langchain-rag" };
    }

    case "get_transcript_excerpt": {
      const query = String(args.query ?? "").toLowerCase();
      const timestamp = String(args.timestamp ?? "");
      const limit = Number(args.limit ?? 8);

      let matches = ctx.segments;

      if (timestamp) {
        matches = ctx.segments.filter((s) => s.timestamp.startsWith(timestamp.split(":")[0]));
      }

      if (query) {
        matches = ctx.segments.filter((s) => s.text.toLowerCase().includes(query));
      }

      return {
        count: matches.length,
        excerpts: matches.slice(0, limit).map((s) => ({
          timestamp: s.timestamp,
          text: s.text,
        })),
      };
    }

    case "search_web": {
      const query = String(args.query ?? "");
      if (!query) throw new Error("search_web requires a query");
      const results = await searchWeb(query, 5);
      return {
        query,
        results,
        note: "Snippets only. For major claims, call read_url on 1–2 primary-source URLs before record_claim.",
      };
    }

    case "read_url": {
      const url = String(args.url ?? "").trim();
      if (!url) throw new Error("read_url requires a url");
      const query = args.query ? String(args.query) : undefined;
      const result = await readUrl(url, { query });
      return {
        ...result,
        note: query
          ? "Query-focused extract: top relevant chunks from the page."
          : "Full page extract (markdown when Tavily is configured).",
      };
    }

    case "run_heuristic_scan": {
      if (ctx.segments.length === 0) {
        throw new Error("Fetch transcript first");
      }
      const durationSeconds = estimateDurationSeconds(ctx.segments);
      const result = analyzeTranscript(ctx.segments, ctx.fullText, durationSeconds);
      return {
        overallScore: result.overallScore,
        summary: result.summary,
        phases: result.phases,
        metrics: result.metrics,
        topClaims: result.claims.slice(0, 15).map((c) => ({
          timestamp: c.timestamp,
          excerpt: c.excerpt,
          technique: c.technique,
          verdict: c.verdict,
          reasoning: c.reasoning,
        })),
        note: "Heuristic pre-scan only. Verify important claims with search_web before recording verdicts.",
      };
    }

    case "record_claim": {
      const sources = (args.sources as string[] | undefined) ?? [];
      const reasoning =
        String(args.reasoning) +
        (sources.length > 0 ? `\n\nSources:\n${sources.map((s) => `- ${s}`).join("\n")}` : "");

      const claim = await prisma.detectedClaim.create({
        data: {
          analysisId: ctx.analysisId,
          text: String(args.text),
          excerpt: String(args.excerpt),
          timestamp: args.timestamp ? String(args.timestamp) : null,
          technique: String(args.technique) as RhetoricTechnique,
          verdict: String(args.verdict) as ClaimVerdict,
          category: "agent-verified",
          confidence: Number(args.confidence ?? 0.8),
          reasoning,
        },
      });
      return { recorded: true, claimId: claim.id };
    }

    case "record_technique_finding": {
      const finding = await prisma.techniqueFinding.create({
        data: {
          analysisId: ctx.analysisId,
          technique: String(args.technique) as RhetoricTechnique,
          score: Number(args.score),
          severity: String(args.severity),
          title: String(args.title),
          summary: String(args.summary),
          evidence: (args.evidence ?? {}) as Prisma.InputJsonValue,
        },
      });
      return { recorded: true, findingId: finding.id };
    }

    case "finish_analysis": {
      await prisma.analysis.update({
        where: { id: ctx.analysisId },
        data: {
          status: "COMPLETED",
          summary: String(args.summary),
          overallScore: Number(args.overallScore),
        },
      });
      return { completed: true };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

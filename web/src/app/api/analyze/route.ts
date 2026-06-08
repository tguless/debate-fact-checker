import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeTranscript } from "@/lib/rhetoric/analyzer";
import { prisma } from "@/lib/prisma";
import {
  buildFullText,
  estimateDurationSeconds,
  extractVideoId,
  fetchVideoTitle,
  getTranscript,
} from "@/lib/youtube";

const requestSchema = z.object({
  url: z.string().min(1, "YouTube URL is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const videoId = extractVideoId(parsed.data.url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse a valid YouTube video ID from that URL." },
        { status: 400 },
      );
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const analysis = await prisma.analysis.create({
      data: {
        videoUrl,
        videoId,
        status: "FETCHING_TRANSCRIPT",
      },
    });

    try {
      const [{ segments, lang }, title] = await Promise.all([
        getTranscript(videoId),
        fetchVideoTitle(videoId),
      ]);
      const fullText = buildFullText(segments);
      const durationSeconds = estimateDurationSeconds(segments);

      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: "ANALYZING",
          title,
          fullText,
          durationSeconds,
          segmentCount: segments.length,
        },
      });

      await prisma.transcriptSegment.createMany({
        data: segments.map((segment) => ({
          analysisId: analysis.id,
          index: segment.index,
          startMs: segment.startMs,
          durationMs: segment.durationMs,
          text: segment.text,
          timestamp: segment.timestamp,
        })),
      });

      const result = analyzeTranscript(segments, fullText, durationSeconds);

      await prisma.techniqueFinding.createMany({
        data: result.techniqueScores.map((finding) => ({
          analysisId: analysis.id,
          technique: finding.technique,
          score: finding.score,
          severity: finding.severity,
          title: finding.title,
          summary: finding.summary,
          evidence: finding.evidence as Prisma.InputJsonValue,
        })),
      });

      await prisma.detectedClaim.createMany({
        data: result.claims.map((claim) => ({
          analysisId: analysis.id,
          text: claim.text,
          timestamp: claim.timestamp,
          startMs: claim.startMs,
          technique: claim.technique,
          category: claim.category,
          confidence: claim.confidence,
          excerpt: claim.excerpt,
          reasoning: claim.reasoning,
          verdict: claim.verdict,
        })),
      });

      const completed = await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: "COMPLETED",
          overallScore: result.overallScore,
          summary: result.summary,
          phases: result.phases as Prisma.InputJsonValue,
          metrics: {
            ...result.metrics,
            transcriptLang: lang,
          } as Prisma.InputJsonValue,
        },
        include: {
          findings: { orderBy: { score: "desc" } },
          claims: { orderBy: { confidence: "desc" }, take: 50 },
        },
      });

      return NextResponse.json({
        analysis: completed,
        phases: result.phases,
        metrics: result.metrics,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transcript fetch or analysis failed";

      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
      });

      return NextResponse.json({ error: message, analysisId: analysis.id }, { status: 422 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

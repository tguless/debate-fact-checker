/**
 * Agent tools defined with Vercel AI SDK `tool()` helper.
 * @see https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
 */
import { tool } from "ai";
import { z } from "zod";
import { executeTool, type ToolContext } from "./tool-executors";

const techniqueEnum = z.enum([
  "GISH_GALLOP",
  "FIREHOSE",
  "CORRELATION_CAUSATION",
  "STATISTICAL_DISTORTION",
  "STRAWMAN",
  "UNSUPPORTED_LEAP",
  "PREEMPTIVE_CLOSURE",
]);

const verdictEnum = z.enum(["FALSE", "MISLEADING", "DISTORTED", "UNSUPPORTED", "FLAGGED"]);

export function createAgentTools(ctx: ToolContext) {
  return {
    read_skill: tool({
      description:
        "Load the Cursor-format debate fact-check skill. Call first to understand mission, verdict rubric, and how to orchestrate your own turns.",
      inputSchema: z.object({}),
      execute: async () => executeTool("read_skill", {}, ctx),
    }),

    fetch_transcript: tool({
      description:
        "Download YouTube transcript, persist segments, and index LangChain RAG chunks for semantic search.",
      inputSchema: z.object({}),
      execute: async () => executeTool("fetch_transcript", {}, ctx),
    }),

    search_transcript_rag: tool({
      description:
        "LangChain RAG semantic search over transcript chunks. Use to find claims by topic without exact keyword match.",
      inputSchema: z.object({
        query: z.string().describe("Natural language query about transcript content"),
        limit: z.number().optional().describe("Max chunks to return (default 6)"),
      }),
      execute: async (input) => executeTool("search_transcript_rag", input, ctx),
    }),

    get_transcript_excerpt: tool({
      description: "Keyword or timestamp search over raw transcript segments.",
      inputSchema: z.object({
        query: z.string().optional(),
        timestamp: z.string().optional(),
        limit: z.number().optional(),
      }),
      execute: async (input) => executeTool("get_transcript_excerpt", input, ctx),
    }),

    search_web: tool({
      description:
        "Search the web for primary sources. Returns short snippets only — follow with read_url on the best primary URL before recording a verdict.",
      inputSchema: z.object({
        query: z.string().describe("Search query targeting primary sources"),
      }),
      execute: async (input) => executeTool("search_web", input, ctx),
    }),

    read_url: tool({
      description:
        "Read full page content from a URL (Tavily Extract). Use after search_web to read primary sources — court reporting, ONS pages, official statements. Pass query to extract only passages relevant to the claim.",
      inputSchema: z.object({
        url: z.string().url().describe("Primary-source URL to read"),
        query: z
          .string()
          .optional()
          .describe("Optional: focus extract on passages relevant to this claim"),
      }),
      execute: async (input) => executeTool("read_url", input, ctx),
    }),

    run_heuristic_scan: tool({
      description:
        "Optional fast pattern scan for Gish Gallop, firehosing, etc. Not required — agent may skip.",
      inputSchema: z.object({}),
      execute: async () => executeTool("run_heuristic_scan", {}, ctx),
    }),

    record_claim: tool({
      description: "Record a fact-checked claim with verdict, reasoning, and optional source URLs.",
      inputSchema: z.object({
        text: z.string(),
        excerpt: z.string(),
        timestamp: z.string().optional(),
        technique: techniqueEnum,
        verdict: verdictEnum,
        reasoning: z.string(),
        sources: z.array(z.string()).optional(),
        confidence: z.number().optional(),
      }),
      execute: async (input) => executeTool("record_claim", input, ctx),
    }),

    record_technique_finding: tool({
      description: "Record a macro-level rhetoric technique observation.",
      inputSchema: z.object({
        technique: techniqueEnum,
        score: z.number(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        title: z.string(),
        summary: z.string(),
        evidence: z.record(z.string(), z.unknown()).optional(),
      }),
      execute: async (input) => executeTool("record_technique_finding", input, ctx),
    }),

    finish_analysis: tool({
      description: "Mark analysis complete with executive summary and overall manipulation score.",
      inputSchema: z.object({
        summary: z.string(),
        overallScore: z.number().min(0).max(100),
      }),
      execute: async (input) => executeTool("finish_analysis", input, ctx),
    }),
  };
}

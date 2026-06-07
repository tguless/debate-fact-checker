import { runAgentAnalysis } from "@/lib/agent/run-agent";
import { prisma } from "@/lib/prisma";
import { extractVideoId } from "@/lib/youtube";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "YouTube URL is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const videoId = extractVideoId(parsed.data.url);
  if (!videoId) {
    return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const analysis = await prisma.analysis.create({
    data: {
      videoUrl,
      videoId,
      status: "PENDING",
      agentMode: true,
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Keep connection alive through long tool calls (transcript fetch, read_url, etc.)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 10_000);

      try {
        send("started", { analysisId: analysis.id, videoId });

        for await (const event of runAgentAnalysis(analysis.id, videoId, videoUrl)) {
          if (event.type === "turn") {
            send("turn", event.turn);
          } else if (event.type === "done") {
            send("done", { analysisId: event.analysisId });
          } else if (event.type === "error") {
            send("error", { message: event.message });
          }
        }
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Stream failed",
        });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

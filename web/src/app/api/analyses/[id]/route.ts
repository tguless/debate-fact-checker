import { NextResponse } from "next/server";
import { cancelAgentRun } from "@/lib/agent/run-registry";
import { prisma } from "@/lib/prisma";
import { clearTranscriptRag } from "@/lib/rag/transcript-rag";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: {
      findings: { orderBy: { score: "desc" } },
      claims: { orderBy: { confidence: "desc" } },
      segments: { orderBy: { index: "asc" } },
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  cancelAgentRun(id);
  clearTranscriptRag(id);

  await prisma.analysis.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

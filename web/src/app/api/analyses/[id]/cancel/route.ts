import { NextResponse } from "next/server";
import { cancelAgentRun } from "@/lib/agent/run-registry";
import { persistTurn } from "@/lib/agent/turn-persistence";
import { isCancellableStatus } from "@/lib/analysis-status";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    select: { id: true, status: true, agentMode: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  if (!isCancellableStatus(analysis.status)) {
    return NextResponse.json(
      { error: `Analysis is ${analysis.status} and cannot be cancelled` },
      { status: 409 },
    );
  }

  const abortedActiveRun = cancelAgentRun(id);

  if (abortedActiveRun) {
    return NextResponse.json({ ok: true, aborting: true });
  }

  const updated = await prisma.analysis.update({
    where: { id },
    data: {
      status: "CANCELLED",
      errorMessage: "Cancelled by user",
    },
  });

  if (analysis.agentMode) {
    const lastTurn = await prisma.agentTurn.findFirst({
      where: { analysisId: id },
      orderBy: { turnIndex: "desc" },
      select: { turnIndex: true },
    });

    await persistTurn(id, (lastTurn?.turnIndex ?? -1) + 1, {
      role: "SYSTEM",
      turnType: "ERROR",
      content: "Cancelled by user",
    });
  }

  return NextResponse.json({ ok: true, analysis: updated });
}

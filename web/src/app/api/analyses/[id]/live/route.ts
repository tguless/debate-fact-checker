import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

/** Lightweight poll endpoint for live UI while agent is running. */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const after = Number(new URL(request.url).searchParams.get("after") ?? -1);

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      overallScore: true,
      summary: true,
      agentMode: true,
      claims: { orderBy: { confidence: "desc" } },
      findings: { orderBy: { score: "desc" } },
      turns: {
        where: after >= 0 ? { turnIndex: { gt: after } } : undefined,
        orderBy: { turnIndex: "asc" },
      },
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const latestTurnIndex =
    analysis.turns.length > 0
      ? Math.max(...analysis.turns.map((t) => t.turnIndex))
      : after;

  return NextResponse.json({
    status: analysis.status,
    overallScore: analysis.overallScore,
    summary: analysis.summary,
    agentMode: analysis.agentMode,
    claims: analysis.claims,
    findings: analysis.findings,
    turns: analysis.turns.map((turn) => ({
      id: turn.id,
      turnIndex: turn.turnIndex,
      role: turn.role,
      turnType: turn.turnType,
      content: turn.content,
      toolName: turn.toolName,
      toolInput: turn.toolInput,
      toolOutput: turn.toolOutput,
      createdAt: turn.createdAt.toISOString(),
    })),
    latestTurnIndex,
  });
}

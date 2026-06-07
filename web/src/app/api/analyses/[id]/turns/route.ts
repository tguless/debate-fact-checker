import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const turns = await prisma.agentTurn.findMany({
    where: { analysisId: id },
    orderBy: { turnIndex: "asc" },
  });

  return NextResponse.json({ turns });
}

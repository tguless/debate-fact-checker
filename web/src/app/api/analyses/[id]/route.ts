import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

import { NextResponse } from "next/server";
import { buildMarkdownReport } from "@/lib/export-markdown";
import { prisma } from "@/lib/prisma";
import type { PhaseMarker } from "@/lib/rhetoric/types";

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
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const phases = (analysis.phases as PhaseMarker[] | null) ?? [];
  const markdown = buildMarkdownReport(analysis, phases);

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="debate-fact-check-${analysis.videoId}.md"`,
    },
  });
}

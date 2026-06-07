import type { ClaimVerdict } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VERDICT_SCORE: Record<ClaimVerdict, number> = {
  FALSE: 85,
  MISLEADING: 72,
  DISTORTED: 68,
  UNSUPPORTED: 55,
  FLAGGED: 45,
};

export async function finalizeAnalysisOnStepLimit(
  analysisId: string,
  maxSteps: number,
): Promise<{ summary: string; overallScore: number }> {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      claims: { orderBy: { confidence: "desc" } },
      findings: { orderBy: { score: "desc" } },
    },
  });

  if (!analysis) {
    throw new Error("Analysis not found");
  }

  const claimLines = analysis.claims.map(
    (c) => `- **${c.verdict}**: ${c.text}`,
  );

  const summaryParts = [
    `Agent reached the ${maxSteps}-step limit before calling \`finish_analysis\`.`,
    analysis.claims.length > 0
      ? `Recorded ${analysis.claims.length} verified claim(s):`
      : "No claims were recorded before the limit.",
    ...claimLines,
  ];

  if (analysis.findings.length > 0) {
    summaryParts.push(
      "",
      `Rhetoric patterns observed (${analysis.findings.length}):`,
      ...analysis.findings.map((f) => `- ${f.title}: ${f.summary}`),
    );
  }

  summaryParts.push(
    "",
    "Some high-value claims may remain unchecked. Re-run with a higher step limit or narrower focus for deeper coverage.",
  );

  const claimScore =
    analysis.claims.length > 0
      ? analysis.claims.reduce((sum, c) => sum + VERDICT_SCORE[c.verdict], 0) /
        analysis.claims.length
      : null;

  const findingScore =
    analysis.findings.length > 0
      ? analysis.findings.reduce((sum, f) => sum + f.score, 0) /
        analysis.findings.length
      : null;

  let overallScore = 50;
  if (claimScore !== null && findingScore !== null) {
    overallScore = Math.round(claimScore * 0.6 + findingScore * 0.4);
  } else if (claimScore !== null) {
    overallScore = Math.round(claimScore);
  } else if (findingScore !== null) {
    overallScore = Math.round(findingScore);
  }

  const summary = summaryParts.join("\n");

  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      status: "COMPLETED",
      summary,
      overallScore,
    },
  });

  return { summary, overallScore };
}

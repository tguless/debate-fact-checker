import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { AnalysisLiveWrapper } from "@/components/analysis-live-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { PhaseMarker } from "@/lib/rhetoric/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params;

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: {
      findings: { orderBy: { score: "desc" } },
      claims: { orderBy: { confidence: "desc" } },
      segments: { orderBy: { index: "asc" } },
      turns: { orderBy: { turnIndex: "asc" } },
    },
  });

  if (!analysis) {
    notFound();
  }

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to home
        </Link>
        <AnalysisLiveWrapper
          initial={{
            ...analysis,
            phases: (analysis.phases as PhaseMarker[] | null) ?? null,
            metrics: (analysis.metrics as Record<string, number> | null) ?? null,
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
          }}
        />
      </div>
    </main>
  );
}

import Link from "next/link";
import { HistoryIcon } from "lucide-react";
import { HistoryAnalysisList } from "@/components/history-analysis-list";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HistoryPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const analyses = await prisma.analysis.findMany({
    where: query
      ? {
          OR: [
            { videoId: { contains: query, mode: "insensitive" } },
            { videoUrl: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      videoId: true,
      videoUrl: true,
      status: true,
      overallScore: true,
      segmentCount: true,
      durationSeconds: true,
      summary: true,
      createdAt: true,
      _count: { select: { claims: true } },
    },
  });

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
          ← Back to home
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-5" />
            <h1 className="font-heading text-3xl font-semibold">Analysis history</h1>
          </div>
          <p className="text-muted-foreground">
            Search past analyses by video ID, URL, or summary text.
          </p>
        </div>

        <form method="get" className="flex gap-3">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search video ID or keywords..."
            className="h-11"
          />
          <button type="submit" className={cn(buttonVariants(), "h-11 px-6")}>
            Search
          </button>
        </form>

        <HistoryAnalysisList
          items={analyses.map((item) => ({
            id: item.id,
            videoId: item.videoId,
            videoUrl: item.videoUrl,
            status: item.status,
            overallScore: item.overallScore,
            segmentCount: item.segmentCount,
            summary: item.summary,
            createdAt: item.createdAt.toISOString(),
            claimCount: item._count.claims,
          }))}
        />
      </div>
    </main>
  );
}

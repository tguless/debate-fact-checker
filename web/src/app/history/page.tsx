import Link from "next/link";
import { HistoryIcon } from "lucide-react";
import { HistoryAnalysisList } from "@/components/history-analysis-list";
import { HistoryPagination } from "@/components/history-pagination";
import { HistoryToolbar } from "@/components/history-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { queryAnalysisHistory } from "@/lib/history-query";
import type { HistoryQueryInput } from "@/lib/history-types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<HistoryQueryInput>;
};

export default async function HistoryPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const result = await queryAnalysisHistory(filters);

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_45%)]" />
      <div className="relative mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 px-6 py-8">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
          ← Back to home
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-5" />
            <h1 className="font-heading text-3xl font-semibold">Analysis history</h1>
          </div>
          <p className="text-muted-foreground">
            Browse past fact-checks with thumbnails, server-side search, filters, and paging.
          </p>
        </div>

        <HistoryToolbar filters={filters} total={result.total} />

        <HistoryAnalysisList items={result.items} />

        <HistoryPagination
          filters={filters}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </div>
    </main>
  );
}

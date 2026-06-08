import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HISTORY_PAGE_SIZE, buildHistorySearchParams } from "@/lib/history-query";
import type { HistoryQueryInput } from "@/lib/history-types";

export function HistoryPagination({
  filters,
  page,
  totalPages,
  total,
}: {
  filters: HistoryQueryInput;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const prevHref =
    page > 1
      ? `/history?${buildHistorySearchParams(filters, { page: page - 1 }).toString()}`
      : null;
  const nextHref =
    page < totalPages
      ? `/history?${buildHistorySearchParams(filters, { page: page + 1 }).toString()}`
      : null;

  const start = (page - 1) * HISTORY_PAGE_SIZE + 1;
  const end = Math.min(page * HISTORY_PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </span>
        )}
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </span>
        )}
      </div>
    </div>
  );
}

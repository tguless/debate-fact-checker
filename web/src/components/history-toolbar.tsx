import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HISTORY_SORT_OPTIONS, type HistoryQueryInput } from "@/lib/history-query";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "AGENT_RUNNING", label: "Agent running" },
  { value: "ANALYZING", label: "Analyzing" },
  { value: "FETCHING_TRANSCRIPT", label: "Fetching transcript" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const MODE_OPTIONS = [
  { value: "all", label: "All runs" },
  { value: "agent", label: "Agent fact-check" },
  { value: "quick", label: "Quick scan" },
] as const;

export function HistoryToolbar({
  filters,
  total,
}: {
  filters: HistoryQueryInput;
  total: number;
}) {
  const q = filters.q?.trim() ?? "";
  const status = filters.status ?? "ALL";
  const mode = filters.mode ?? "all";
  const sort = filters.sort ?? "createdAt_desc";

  return (
    <Card className="border-border/60 bg-card/70">
      <CardContent className="pt-6">
        <form method="get" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search title, channel, video ID, URL, summary…"
              className="h-11 min-w-0 flex-1"
            />
            <button type="submit" className={cn(buttonVariants(), "h-11 shrink-0 px-6")}>
              Search
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Run type</span>
              <select
                name="mode"
                defaultValue={mode}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Sort by</span>
              <select
                name="sort"
                defaultValue={sort}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {HISTORY_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm text-muted-foreground">
            {total === 0 ? "No analyses match these filters." : `${total} analyses found`}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

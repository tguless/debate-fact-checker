import Link from "next/link";
import { WavesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resolveAnalysisChannel,
  resolveAnalysisThumbnail,
  resolveAnalysisTitle,
} from "@/lib/analysis-video-display";
import { queryAnalysisHistory } from "@/lib/history-query";

export async function RecentAnalysesCard() {
  const { items, total } = await queryAnalysisHistory({ page: 1 });

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <WavesIcon className="size-4" />
          Recent analyses
        </CardTitle>
        {total > 0 ? (
          <Link href="/history" className="text-sm text-primary hover:underline">
            View all ({total})
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No analyses yet. Run your first URL.</p>
        ) : (
          items.slice(0, 5).map((item) => {
            const title = resolveAnalysisTitle(item);
            const thumbnail = resolveAnalysisThumbnail(item);
            const channel = resolveAnalysisChannel(item);

            return (
              <Link
                key={item.id}
                href={`/analyses/${item.id}`}
                className="flex gap-3 rounded-lg border border-border/60 p-2 transition-colors hover:bg-muted/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt=""
                  className="size-16 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{title}</p>
                  {channel ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{channel}</p>
                  ) : (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.videoId}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {item.agentMode ? <Badge variant="secondary">Agent</Badge> : null}
                    <Badge variant="outline">{item.status}</Badge>
                    {item.overallScore != null ? (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(item.overallScore)}/100
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

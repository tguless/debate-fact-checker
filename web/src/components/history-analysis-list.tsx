"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  resolveAnalysisChannel,
  resolveAnalysisThumbnail,
  resolveAnalysisTitle,
} from "@/lib/analysis-video-display";
import { DeleteAnalysisButton } from "@/components/delete-analysis-button";
import type { HistoryListItem } from "@/lib/history-query";

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m ${remainder}s`;
}

export function HistoryAnalysisList({ items }: { items: HistoryListItem[] }) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No analyses found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const title = resolveAnalysisTitle(item);
        const thumbnail = resolveAnalysisThumbnail(item);
        const channel = resolveAnalysisChannel(item);
        const duration = formatDuration(item.durationSeconds);

        return (
          <Card key={item.id} className="overflow-hidden border-border/60 transition-colors hover:bg-muted/20">
            <CardContent className="flex flex-col gap-4 p-0 sm:flex-row">
              <Link
                href={`/analyses/${item.id}`}
                className="relative block aspect-video w-full shrink-0 bg-muted sm:w-52 lg:w-60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                />
                {duration ? (
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
                    {duration}
                  </span>
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:py-4 sm:pr-4 sm:pl-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/analyses/${item.id}`} className="group block min-w-0">
                      <h2 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                        {title}
                      </h2>
                    </Link>
                    {channel ? (
                      item.channelUrl ? (
                        <a
                          href={item.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-sm text-muted-foreground hover:text-foreground"
                        >
                          {channel}
                        </a>
                      ) : (
                        <p className="mt-1 truncate text-sm text-muted-foreground">{channel}</p>
                      )
                    ) : (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{item.videoId}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="outline">{item.status}</Badge>
                    {item.overallScore != null ? (
                      <span className="text-sm font-medium">{Math.round(item.overallScore)}/100</span>
                    ) : null}
                    <DeleteAnalysisButton
                      analysisId={item.id}
                      videoId={item.videoId}
                      size="sm"
                      variant="ghost"
                      onDeleted={() => router.refresh()}
                    />
                  </div>
                </div>

                {item.summary ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {item.agentMode ? <Badge variant="secondary">Agent</Badge> : null}
                  <Link href={`/analyses/${item.id}`} className="hover:text-foreground">
                    {item.claimCount} claims flagged
                  </Link>
                  <span>·</span>
                  <span>{item.segmentCount} segments</span>
                  <span>·</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

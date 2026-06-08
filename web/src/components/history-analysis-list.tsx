"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAnalysisButton } from "@/components/delete-analysis-button";

export type HistoryAnalysisItem = {
  id: string;
  videoId: string;
  videoUrl: string;
  status: string;
  overallScore: number | null;
  segmentCount: number;
  summary: string | null;
  createdAt: string;
  claimCount: number;
};

export function HistoryAnalysisList({ items }: { items: HistoryAnalysisItem[] }) {
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
      {items.map((item) => (
        <Card key={item.id} className="border-border/60 transition-colors hover:bg-muted/30">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <Link href={`/analyses/${item.id}`} className="min-w-0 flex-1">
              <div className="flex flex-col gap-1">
                <CardTitle className="font-mono text-sm">{item.videoId}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {item.summary ?? item.videoUrl}
                </CardDescription>
              </div>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge variant="outline">{item.status}</Badge>
              {item.overallScore ? (
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
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link href={`/analyses/${item.id}`} className="hover:text-foreground">
              {item.claimCount} claims flagged
            </Link>
            <span>·</span>
            <span>{item.segmentCount} segments</span>
            <span>·</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

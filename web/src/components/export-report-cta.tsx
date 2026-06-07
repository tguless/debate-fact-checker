"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  LinkIcon,
  Share2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ExportReportCtaProps = {
  analysisId: string;
  videoId: string;
  videoUrl: string;
  status: string;
  live: boolean;
  overallScore: number | null;
  claimCount: number;
  findingCount: number;
  agentMode: boolean;
  summary: string | null;
  compact?: boolean;
};

export function ExportReportCta({
  analysisId,
  videoId,
  videoUrl,
  status,
  live,
  overallScore,
  claimCount,
  findingCount,
  agentMode,
  summary,
  compact = false,
}: ExportReportCtaProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isReady = !live && status === "COMPLETED";
  const exportUrl = `/api/analyses/${analysisId}/export`;
  const filename = `debate-fact-check-${videoId}.md`;

  const highlights = [
    claimCount > 0
      ? `${claimCount} fact-checked claim${claimCount === 1 ? "" : "s"} with verdicts and reasoning`
      : null,
    findingCount > 0
      ? `${findingCount} rhetoric technique finding${findingCount === 1 ? "" : "s"}`
      : null,
    overallScore != null ? `Manipulation score: ${Math.round(overallScore)}/100` : null,
    agentMode ? "Agent verification trail (sources cited in claim notes)" : "Heuristic scan results",
    "Timestamped transcript excerpts",
    "Markdown — paste into Notes, Notion, or a rebuttal draft",
  ].filter(Boolean) as string[];

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded", {
        description: filename,
      });
    } catch {
      toast.error("Could not download report. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopySummary() {
    if (!summary?.trim()) {
      toast.error("No summary to copy yet.");
      return;
    }

    const scoreLine =
      overallScore != null ? `Score: ${Math.round(overallScore)}/100` : "Score: pending";
    const text = [
      "Debate Fact Checker — Analysis Summary",
      `Video: ${videoUrl}`,
      scoreLine,
      "",
      summary,
      "",
      `Full report: ${window.location.origin}/analyses/${analysisId}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Summary copied — ready to paste");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyLink() {
    const link = `${window.location.origin}/analyses/${analysisId}`;
    await navigator.clipboard.writeText(link);
    toast.success("Report link copied");
  }

  if (live) {
    if (compact) return null;
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <FileTextIcon className="size-5 shrink-0 text-primary" />
          <p>
            Download will unlock when the agent finishes — your full report with claims,
            sources, and scores will be ready to export.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    if (!isReady) return null;
    return (
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-sm font-medium">
          {claimCount} claims verified · {findingCount} patterns · ready to share
        </p>
        <Button disabled={downloading} onClick={handleDownload}>
          <DownloadIcon data-icon="inline-start" />
          {downloading ? "Preparing…" : "Download report"}
        </Button>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card shadow-sm">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Share2Icon className="size-5 text-primary" />
              <h3 className="font-heading text-lg font-semibold">Download your report</h3>
              {isReady ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckIcon className="size-3" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="outline">{status}</Badge>
              )}
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {isReady
                ? "You’ve got a citeable breakdown of this monologue — verdicts, rhetoric patterns, and excerpts in one file. Save it before you lose the tab."
                : "Analysis still in progress. Export opens once the run completes."}
            </p>
          </div>

          <Button
            size="lg"
            className="h-12 shrink-0 px-6 shadow-md"
            disabled={!isReady || downloading}
            onClick={handleDownload}
          >
            <DownloadIcon data-icon="inline-start" className="size-5" />
            {downloading ? "Preparing…" : "Download .md report"}
          </Button>
        </div>

        {isReady ? (
          <>
            <ul className="grid gap-2 sm:grid-cols-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <span className="text-xs text-muted-foreground">Also:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!summary}
                onClick={handleCopySummary}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                Copy summary for social
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
                <LinkIcon data-icon="inline-start" />
                Copy report link
              </Button>
              <span className="font-mono text-xs text-muted-foreground">{filename}</span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

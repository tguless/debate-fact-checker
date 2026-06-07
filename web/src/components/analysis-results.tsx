"use client";

import { DownloadIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentTurnTimeline, type AgentTurn } from "@/components/agent-turn-timeline";
import { ClaimList } from "@/components/claim-list";
import { PhaseTimeline } from "@/components/phase-timeline";
import { TechniqueScoreCard } from "@/components/technique-score-card";
import type { PhaseMarker } from "@/lib/rhetoric/types";

type AnalysisPayload = {
  id: string;
  videoUrl: string;
  videoId: string;
  status: string;
  overallScore: number | null;
  summary: string | null;
  segmentCount: number;
  durationSeconds: number | null;
  findings: Array<{
    id: string;
    title: string;
    score: number;
    severity: string;
    summary: string;
    technique: string;
  }>;
  claims: Array<{
    id: string;
    text: string;
    timestamp: string | null;
    technique: string;
    category: string;
    confidence: number;
    excerpt: string;
    reasoning: string;
    verdict: string;
  }>;
  phases?: PhaseMarker[] | null;
  metrics?: Record<string, number> | null;
  agentMode?: boolean;
  turns?: AgentTurn[];
  segments: Array<{
    id: string;
    index: number;
    timestamp: string;
    text: string;
  }>;
};

export function AnalysisResults({
  analysis,
  live = false,
}: {
  analysis: AnalysisPayload;
  live?: boolean;
}) {
  const durationLabel = analysis.durationSeconds
    ? `${Math.floor(analysis.durationSeconds / 60)}m ${analysis.durationSeconds % 60}s`
    : "Unknown";

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{analysis.status}</Badge>
            {live ? <Badge variant="secondary">Live</Badge> : null}
            {analysis.agentMode ? <Badge variant="secondary">Agent mode</Badge> : null}
            <Badge variant="outline">{analysis.segmentCount} segments</Badge>
            <Badge variant="outline">{durationLabel}</Badge>
          </div>
          <CardTitle className="font-heading text-2xl">Rhetoric analysis report</CardTitle>
          <CardDescription>
            <a
              href={analysis.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {analysis.videoUrl}
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall manipulation signal</span>
              <span className="font-semibold">
                {analysis.overallScore ? Math.round(analysis.overallScore) : 0}/100
              </span>
            </div>
            <Progress value={analysis.overallScore ?? 0} />
          </div>
          {analysis.summary ? (
            <Alert>
              <AlertTitle>Summary</AlertTitle>
              <AlertDescription>{analysis.summary}</AlertDescription>
            </Alert>
          ) : null}
          <a
            href={`/api/analyses/${analysis.id}/export`}
            download
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            <DownloadIcon data-icon="inline-start" />
            Export Markdown report
          </a>
        </CardContent>
      </Card>

      {analysis.phases && analysis.phases.length > 0 ? (
        <PhaseTimeline phases={analysis.phases} />
      ) : null}

      {analysis.metrics ? (
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(analysis.metrics).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-border/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        defaultValue={
          analysis.agentMode && (analysis.turns?.length || live) ? "turns" : "techniques"
        }
      >
        <TabsList>
          {analysis.agentMode && analysis.turns?.length ? (
            <TabsTrigger value="turns">Agent turns ({analysis.turns.length})</TabsTrigger>
          ) : null}
          <TabsTrigger value="techniques">Techniques</TabsTrigger>
          <TabsTrigger value="claims">Flagged claims ({analysis.claims.length})</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        {analysis.agentMode && (analysis.turns?.length || live) ? (
          <TabsContent value="turns" className="mt-4">
            <AgentTurnTimeline turns={analysis.turns ?? []} live={live} />
          </TabsContent>
        ) : null}

        <TabsContent value="techniques" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.findings.map((finding) => (
              <TechniqueScoreCard
                key={finding.id}
                title={finding.title}
                score={finding.score}
                severity={finding.severity}
                summary={finding.summary}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="claims" className="mt-4">
          <ClaimList claims={analysis.claims} />
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Full transcript</CardTitle>
              <CardDescription>Timestamped segments used for analysis</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="flex flex-col gap-3">
                {analysis.segments.map((segment) => (
                  <div key={segment.id} className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      [{segment.timestamp}]
                    </span>
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

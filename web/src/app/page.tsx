import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { AgentPageClient } from "@/app/agent/agent-page-client";
import { AnalysisForm } from "@/components/analysis-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentAnalysesCard } from "@/components/recent-analyses-card";
import { getApiKeyStatus } from "@/lib/env-status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const keyStatus = getApiKeyStatus();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_35%)]" />

      <div className="relative mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Next.js + Postgres</Badge>
            {keyStatus.agentReady ? (
              <Badge variant="outline">Agent fact-check enabled</Badge>
            ) : (
              <Badge variant="outline">Heuristic rhetoric audit</Badge>
            )}
            {keyStatus.agentReady ? (
              <Link href="/agent" className="text-sm text-primary hover:underline">
                Agent page →
              </Link>
            ) : (
              <Link href="/agent" className="text-sm text-primary hover:underline">
                Agent fact-check →
              </Link>
            )}
            <Link href="/history" className="text-sm text-primary hover:underline">
              History →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
              Debate Fact Checker
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {keyStatus.agentReady
                ? "Paste a YouTube debate or monologue. The agent fetches the transcript, searches primary sources, and streams live fact-check turns with citeable verdicts."
                : "Turn a YouTube monologue into a structured audit of misleading debate tactics — Gish Gallop density, firehose repetition, correlation-to-causation leaps, and unsourced statistics."}
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex min-w-0 flex-col gap-6">
            {keyStatus.agentReady ? (
              <>
                <AgentPageClient agentReady />
                <p className="text-sm text-muted-foreground">
                  Offline English keyword scan only —{" "}
                  <Link href="/quick" className="text-primary hover:underline">
                    quick scan
                  </Link>
                </p>
              </>
            ) : (
              <AnalysisForm />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlertIcon className="size-4" />
                  What we detect
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>Gish Gallop — claim volume outpacing verification speed</p>
                <p>Firehosing — repeated certainty without evidence</p>
                <p>Correlation → causation — stats promoted to conspiracy</p>
                <p>Statistical distortion — ratios and percentages without context</p>
                <p>Strawman — media/opponent caricature for persecution framing</p>
              </CardContent>
            </Card>

            <RecentAnalysesCard />
          </div>
        </div>
      </div>
    </main>
  );
}

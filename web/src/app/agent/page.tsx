"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentTurnTimelineLive } from "@/components/agent-turn-timeline";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AgentPage() {
  const [url, setUrl] = useState("");
  const [startedUrl, setStartedUrl] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
          ← Back to home
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">Agent fact-check</h1>
          <p className="max-w-2xl text-muted-foreground">
            Powered by Vercel AI SDK ToolLoopAgent + LangChain RAG + Cursor skill. The agent
            decides each step, searches sources, and records verdicts — you watch every turn.
          </p>
        </div>

        {!startedUrl ? (
          <Card>
            <CardHeader>
              <CardTitle>Start agent run</CardTitle>
              <CardDescription>
                No fixed pipeline — the agent orchestrates fetch, search, verify, and record in
                whatever order it chooses.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-12"
              />
              <button
                type="button"
                className={cn(buttonVariants(), "h-12")}
                disabled={!url.trim()}
                onClick={() => setStartedUrl(url.trim())}
              >
                Launch agent
              </button>
            </CardContent>
          </Card>
        ) : (
          <AgentTurnTimelineLive url={startedUrl} />
        )}
      </div>
    </main>
  );
}

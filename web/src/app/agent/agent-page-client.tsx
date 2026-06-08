"use client";

import { useState } from "react";
import { AgentTurnTimelineLive } from "@/components/agent-turn-timeline";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AgentPageClient({ agentReady }: { agentReady: boolean }) {
  const [url, setUrl] = useState("");
  const [startedUrl, setStartedUrl] = useState<string | null>(null);

  return (
    <>
      {!startedUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Agent fact-check</CardTitle>
            <CardDescription>
              Multi-turn verification with transcript RAG, web search, and full-page source reads.
              Every tool call streams live below — do not use quick scan unless you only want English
              keyword heuristics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="h-12"
              disabled={!agentReady}
            />
            <button
              type="button"
              className={cn(buttonVariants(), "h-12")}
              disabled={!agentReady || !url.trim()}
              onClick={() => setStartedUrl(url.trim())}
            >
              Launch agent fact-check
            </button>
            {!agentReady ? (
              <p className="text-sm text-muted-foreground">
                Add your OpenAI and Tavily keys to <code>web/.env</code>, then restart the app.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <AgentTurnTimelineLive
          url={startedUrl}
          onCancelled={() => {
            setStartedUrl(null);
            setUrl("");
          }}
        />
      )}
    </>
  );
}

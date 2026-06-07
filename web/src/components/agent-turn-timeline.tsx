"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BotIcon,
  CheckCircle2Icon,
  Loader2Icon,
  WrenchIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type AgentTurn = {
  id: string;
  turnIndex: number;
  role: string;
  turnType: string;
  content: string | null;
  toolName: string | null;
  toolInput: unknown;
  toolOutput: unknown;
  createdAt: string;
};

const roleIcon: Record<string, typeof BotIcon> = {
  AGENT: BotIcon,
  TOOL: WrenchIcon,
  SYSTEM: CheckCircle2Icon,
};

const turnTypeLabel: Record<string, string> = {
  THINKING: "Reasoning",
  TOOL_CALL: "Tool call",
  TOOL_RESULT: "Tool result",
  MESSAGE: "System",
  COMPLETE: "Complete",
  ERROR: "Error",
};

function TurnBody({ turn }: { turn: AgentTurn }) {
  if (turn.turnType === "TOOL_CALL" && turn.toolName) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm text-primary">{turn.toolName}</p>
        {turn.toolInput ? (
          <pre className="max-h-48 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
            {JSON.stringify(turn.toolInput, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  if (turn.turnType === "TOOL_RESULT") {
    return (
      <pre className="max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-xs leading-relaxed">
        {turn.content ??
          (turn.toolOutput ? JSON.stringify(turn.toolOutput, null, 2) : "No output")}
      </pre>
    );
  }

  if (turn.content) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.content}</p>;
  }

  return null;
}

export function AgentTurnTimeline({
  turns = [],
  live = false,
}: {
  turns?: AgentTurn[];
  live?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Agent turns</CardTitle>
            <CardDescription>
              Vercel AI SDK ToolLoopAgent — the agent orchestrates its own sequence via the Cursor
              skill
            </CardDescription>
          </div>
          {live ? (
            <Badge variant="secondary" className="gap-1">
              <Loader2Icon className="size-3 animate-spin" />
              Running
            </Badge>
          ) : (
            <Badge variant="outline">{turns.length} turns</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex max-h-[700px] flex-col gap-4 overflow-y-auto pr-2">
          {turns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Waiting for agent to start...
            </p>
          ) : (
            turns.map((turn) => {
              const Icon = roleIcon[turn.role] ?? BotIcon;
              return (
                <div key={turn.id} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium">Turn {turn.turnIndex + 1}</span>
                      <Badge variant="outline">{turnTypeLabel[turn.turnType] ?? turn.turnType}</Badge>
                      {turn.toolName ? (
                        <Badge variant="secondary">{turn.toolName}</Badge>
                      ) : null}
                    </div>
                    <TurnBody turn={turn} />
                    <Separator />
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}

function parseSseChunk(chunk: string): { event: string; data: string } | null {
  if (chunk.startsWith(":")) return null;

  const lines = chunk.split("\n");
  let event = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    if (line.startsWith("data: ")) data += line.slice(6);
  }

  if (!data) return null;
  return { event, data };
}

export function AgentTurnTimelineLive({
  url,
  onStarted,
}: {
  url: string;
  onStarted?: (analysisId: string) => void;
}) {
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    const abort = new AbortController();
    setStatus("running");
    setTurns([]);
    setAnalysisId(null);
    setError(null);

    async function run() {
      const response = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        setError("Failed to start agent");
        setStatus("error");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const parsedChunk = parseSseChunk(chunk);
          if (!parsedChunk) continue;

          const parsed = JSON.parse(parsedChunk.data) as Record<string, unknown>;

          if (parsedChunk.event === "started") {
            const id = String(parsed.analysisId);
            setAnalysisId(id);
            onStarted?.(id);
          } else if (parsedChunk.event === "turn") {
            setTurns((prev) => [...prev, parsed as unknown as AgentTurn]);
          } else if (parsedChunk.event === "done") {
            setAnalysisId(String(parsed.analysisId));
            setStatus("done");
          } else if (parsedChunk.event === "error") {
            setError(String(parsed.message));
            setStatus("error");
          }
        }
      }

      setStatus((current) => (current === "running" ? "done" : current));
    }

    run().catch((err) => {
      if (abort.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Agent failed");
      setStatus("error");
    });

    return () => abort.abort();
  }, [url, onStarted]);

  return (
    <div className="flex flex-col gap-4">
      {status === "running" ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2Icon className="size-4 animate-spin" />
            Agent is working — turns stream in via SSE as each tool completes
          </div>
          {analysisId ? (
            <Link
              href={`/analyses/${analysisId}`}
              className="text-primary hover:underline"
            >
              Open live report page →
            </Link>
          ) : null}
        </div>
      ) : null}
      {status === "done" && analysisId ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">Analysis complete.</p>
          <Link
            href={`/analyses/${analysisId}`}
            className={cn(buttonVariants({ variant: "default" }), "h-9")}
          >
            View full report
          </Link>
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AgentTurnTimeline turns={turns} live={status === "running"} />
    </div>
  );
}

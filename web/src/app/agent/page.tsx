import Link from "next/link";
import { ApiKeysSetupCard } from "@/components/api-keys-setup-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiKeyStatus } from "@/lib/env-status";
import { AgentPageClient } from "./agent-page-client";

export default function AgentPage() {
  const keyStatus = getApiKeyStatus();

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
            Autonomous multi-turn verification — transcript RAG, web search, full-page source reads,
            and per-claim verdicts streamed live.
          </p>
        </div>

        <ApiKeysSetupCard status={keyStatus} />
        <AgentPageClient agentReady={keyStatus.agentReady} />
      </div>
    </main>
  );
}

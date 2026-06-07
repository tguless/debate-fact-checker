import { ExternalLinkIcon, KeyRoundIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiKeyStatus } from "@/lib/env-status";

export function ApiKeysSetupCard({ status }: { status: ApiKeyStatus }) {
  if (status.agentReady) return null;

  return (
    <Alert variant="destructive" className="border-amber-500/40 bg-amber-500/10 text-foreground">
      <KeyRoundIcon className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle>API keys required for agent mode</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-sm">
        <p>
          Agent fact-checking won&apos;t work until you add <strong>your own</strong> OpenAI and
          Tavily keys to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">web/.env</code> (Next.js reads
          this file).
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            <code className="text-xs">cp web/.env.example web/.env</code>
          </li>
          <li>
            Set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">OPENAI_API_KEY</code>
            {!status.openai ? " — missing" : " — set"}
          </li>
          <li>
            Set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">TAVILY_API_KEY</code>
            {!status.tavily ? " — missing" : " — set"}
          </li>
          <li>
            Restart: <code className="text-xs">./stop.sh && ./start.sh</code>
          </li>
        </ol>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Get OpenAI key
            <ExternalLinkIcon className="size-3" />
          </a>
          <a
            href="https://tavily.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Get Tavily key
            <ExternalLinkIcon className="size-3" />
          </a>
        </p>
        <p className="text-muted-foreground">
          Quick scan on the homepage works without keys. Agent mode needs both — OpenAI runs the
          agent; Tavily searches the web and reads full source pages.
        </p>
      </AlertDescription>
    </Alert>
  );
}

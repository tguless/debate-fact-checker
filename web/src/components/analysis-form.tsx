"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AnalysisForm({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) {
      toast.error("Paste a YouTube URL first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }

      toast.success("Analysis complete");
      router.push(`/analyses/${data.analysis.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isSecondary = variant === "secondary";

  return (
    <Card
      className={
        isSecondary
          ? "border-border/60 bg-card/60"
          : "border-border/60 bg-card/80 shadow-xl backdrop-blur"
      }
    >
      <CardHeader>
        <CardTitle className={isSecondary ? "text-lg" : "font-heading text-2xl"}>
          {isSecondary ? "Quick scan (offline heuristics)" : "Analyze a debate or monologue"}
        </CardTitle>
        <CardDescription>
          {isSecondary ? (
            <>
              English keyword patterns only — skips LLM fact-checking. Use agent mode above for
              source-verified analysis (works on any language).
            </>
          ) : (
            <>
              Quick heuristic scan — no API keys needed. For source-verified fact-checking, use{" "}
              <a href="/agent" className="text-primary hover:underline">
                Agent mode
              </a>{" "}
              (requires your OpenAI + Tavily keys in <code className="text-xs">web/.env</code>).
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={loading}
            className="h-12"
          />
          <Button type="submit" disabled={loading} className="h-12">
            {loading ? (
              <>
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
                Fetching transcript and analyzing...
              </>
            ) : (
              <>
                <SearchIcon data-icon="inline-start" />
                Run rhetoric analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

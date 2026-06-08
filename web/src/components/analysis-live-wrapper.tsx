"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResults } from "@/components/analysis-results";
import type { AgentTurn } from "@/components/agent-turn-timeline";
import { isRunningStatus } from "@/lib/analysis-status";
import type { PhaseMarker } from "@/lib/rhetoric/types";

type AnalysisPayload = {
  id: string;
  videoUrl: string;
  videoId: string;
  title?: string | null;
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

export function AnalysisLiveWrapper({ initial }: { initial: AnalysisPayload }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(initial);
  const latestTurnIndex = useRef(
    initial.turns?.length ? Math.max(...initial.turns.map((t) => t.turnIndex)) : -1,
  );

  const handleCancelled = useCallback(() => {
    setAnalysis((prev) => ({
      ...prev,
      status: "CANCELLED",
      summary: "Cancelled by user",
    }));
  }, []);

  const poll = useCallback(async () => {
    const response = await fetch(
      `/api/analyses/${initial.id}/live?after=${latestTurnIndex.current}`,
    );
    if (!response.ok) return;

    const data = (await response.json()) as {
      status: string;
      overallScore: number | null;
      summary: string | null;
      claims: AnalysisPayload["claims"];
      findings: AnalysisPayload["findings"];
      turns: AgentTurn[];
      latestTurnIndex: number;
    };

    setAnalysis((prev) => {
      const existingIds = new Set((prev.turns ?? []).map((t) => t.id));
      const newTurns = data.turns.filter((t) => !existingIds.has(t.id));

      return {
        ...prev,
        status: data.status,
        overallScore: data.overallScore,
        summary: data.summary,
        claims: data.claims,
        findings: data.findings,
        turns: [...(prev.turns ?? []), ...newTurns],
      };
    });

    if (data.latestTurnIndex > latestTurnIndex.current) {
      latestTurnIndex.current = data.latestTurnIndex;
    }
  }, [initial.id]);

  useEffect(() => {
    if (!isRunningStatus(analysis.status)) return;

    const interval = setInterval(() => {
      poll().catch(() => undefined);
    }, 2000);

    poll().catch(() => undefined);

    return () => clearInterval(interval);
  }, [analysis.status, poll]);

  const handleDeleted = useCallback(() => {
    router.push("/history");
  }, [router]);

  return (
    <AnalysisResults
      analysis={analysis}
      live={isRunningStatus(analysis.status)}
      onCancelled={handleCancelled}
      onDeleted={handleDeleted}
    />
  );
}

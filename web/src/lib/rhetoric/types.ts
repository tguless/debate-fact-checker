import type { ClaimVerdict, RhetoricTechnique } from "@prisma/client";

export type TechniqueScore = {
  technique: RhetoricTechnique;
  score: number;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
};

export type DetectedClaimResult = {
  text: string;
  timestamp: string | null;
  startMs: number | null;
  technique: RhetoricTechnique;
  category: string;
  confidence: number;
  excerpt: string;
  reasoning: string;
  verdict: ClaimVerdict;
};

export type PhaseMarker = {
  phase: string;
  startMs: number;
  timestamp: string;
  description: string;
  confidence: number;
  trigger?: string;
};

export type AnalysisResult = {
  overallScore: number;
  summary: string;
  techniqueScores: TechniqueScore[];
  claims: DetectedClaimResult[];
  phases: PhaseMarker[];
  metrics: {
    claimDensityPerMinute: number;
    statisticMentions: number;
    repetitionHits: number;
    topicShifts: number;
    causalLeaps: number;
  };
};

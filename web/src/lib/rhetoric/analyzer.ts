import type { ClaimVerdict, RhetoricTechnique } from "@prisma/client";
import type { TranscriptSegment } from "@/lib/youtube";
import {
  CAUSAL_LEAP_MARKERS,
  FIREHOSE_PHRASES,
  GISH_GALLOP_PHASES,
  PHASE_SIGNALS,
  PREEMPTIVE_CLOSURE,
  STATISTIC_PATTERNS,
  STRAWMAN_PATTERNS,
  TOPIC_SHIFT_MARKERS,
  VERIFIABLE_ASSERTION_STARTERS,
} from "./patterns";
import type {
  AnalysisResult,
  DetectedClaimResult,
  PhaseMarker,
  TechniqueScore,
} from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function severityFromScore(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function deriveVerdict(technique: RhetoricTechnique): ClaimVerdict {
  switch (technique) {
    case "STATISTICAL_DISTORTION":
      return "DISTORTED";
    case "STRAWMAN":
      return "FALSE";
    case "CORRELATION_CAUSATION":
      return "MISLEADING";
    case "UNSUPPORTED_LEAP":
      return "UNSUPPORTED";
    default:
      return "FLAGGED";
  }
}

function windowText(segments: TranscriptSegment[], centerIndex: number, radius = 2): string {
  const start = Math.max(0, centerIndex - radius);
  const end = Math.min(segments.length - 1, centerIndex + radius);
  return segments
    .slice(start, end + 1)
    .map((segment) => segment.text)
    .join(" ");
}

function countMatches(text: string, patterns: RegExp[]): number {
  let total = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    total += matches?.length ?? 0;
  }
  return total;
}

function findPhraseHits(
  segments: TranscriptSegment[],
  phrases: string[],
): Array<{ phrase: string; segment: TranscriptSegment }> {
  const hits: Array<{ phrase: string; segment: TranscriptSegment }> = [];

  for (const segment of segments) {
    const lower = segment.text.toLowerCase();
    for (const phrase of phrases) {
      if (lower.includes(phrase)) {
        hits.push({ phrase, segment });
      }
    }
  }

  return hits;
}

function detectClaims(segments: TranscriptSegment[]): DetectedClaimResult[] {
  const claims: DetectedClaimResult[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const lower = segment.text.toLowerCase();
    const context = windowText(segments, i, 3);

    for (const pattern of STATISTIC_PATTERNS) {
      const matches = segment.text.match(pattern);
      if (matches) {
        for (const match of matches) {
          claims.push({
            text: segment.text,
            timestamp: segment.timestamp,
            startMs: segment.startMs,
            technique: "STATISTICAL_DISTORTION",
            category: "statistic",
            confidence: 0.72,
            excerpt: match,
            reasoning:
              "Numeric claim delivered without sourcing, denominator, or methodology — common distortion vector in debate gallops.",
            verdict: deriveVerdict("STATISTICAL_DISTORTION"),
          });
        }
      }
    }

    for (const phrase of FIREHOSE_PHRASES) {
      if (lower.includes(phrase)) {
        claims.push({
          text: segment.text,
          timestamp: segment.timestamp,
          startMs: segment.startMs,
          technique: "FIREHOSE",
          category: "repetition",
          confidence: 0.85,
          excerpt: phrase,
          reasoning:
            "Preemptive social-proof phrase that substitutes repetition for evidence.",
          verdict: deriveVerdict("FIREHOSE"),
        });
      }
    }

    for (const phrase of PREEMPTIVE_CLOSURE) {
      if (lower.includes(phrase)) {
        claims.push({
          text: segment.text,
          timestamp: segment.timestamp,
          startMs: segment.startMs,
          technique: "PREEMPTIVE_CLOSURE",
          category: "closure",
          confidence: 0.8,
          excerpt: phrase,
          reasoning:
            "Assertion closed as settled before the audience can verify it.",
          verdict: deriveVerdict("PREEMPTIVE_CLOSURE"),
        });
      }
    }

    for (const marker of CAUSAL_LEAP_MARKERS) {
      if (lower.includes(marker)) {
        const hasNearbyStat = countMatches(context, STATISTIC_PATTERNS) > 0;
        const technique = hasNearbyStat ? "CORRELATION_CAUSATION" : "UNSUPPORTED_LEAP";
        claims.push({
          text: segment.text,
          timestamp: segment.timestamp,
          startMs: segment.startMs,
          technique,
          category: hasNearbyStat ? "causal_leap" : "unsupported_leap",
          confidence: hasNearbyStat ? 0.78 : 0.65,
          excerpt: marker,
          reasoning: hasNearbyStat
            ? "Causal or intentional language appears adjacent to statistics — correlation promoted to conspiracy."
            : "Civilization-scale causal claim without demonstrated mechanism or controlled evidence.",
          verdict: deriveVerdict(technique),
        });
      }
    }

    for (const pattern of STRAWMAN_PATTERNS) {
      const matches = segment.text.match(pattern);
      if (matches) {
        for (const match of matches) {
          claims.push({
            text: segment.text,
            timestamp: segment.timestamp,
            startMs: segment.startMs,
            technique: "STRAWMAN",
            category: "strawman",
            confidence: 0.7,
            excerpt: match,
            reasoning:
              "Attributed position to media or opponents in a way that inflates persecution framing.",
            verdict: deriveVerdict("STRAWMAN"),
          });
        }
      }
    }

    for (const pattern of VERIFIABLE_ASSERTION_STARTERS) {
      const matches = segment.text.match(pattern);
      if (matches) {
        claims.push({
          text: segment.text,
          timestamp: segment.timestamp,
          startMs: segment.startMs,
          technique: "GISH_GALLOP",
          category: "verifiable_assertion",
          confidence: 0.68,
          excerpt: matches[0],
          reasoning:
            "Verifiable-sounding assertion delivered in rapid sequence — classic gallop fodder.",
          verdict: deriveVerdict("GISH_GALLOP"),
        });
      }
    }
  }

  const seen = new Set<string>();
  return claims.filter((claim) => {
    const key = `${claim.startMs}:${claim.excerpt}:${claim.technique}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferPhases(segments: TranscriptSegment[]): PhaseMarker[] {
  if (segments.length === 0) return [];

  let searchFromMs = 0;
  const markers: PhaseMarker[] = [];

  for (const phaseDef of GISH_GALLOP_PHASES) {
    const patterns = PHASE_SIGNALS[phaseDef.phase] ?? [];
    let bestMatch: { segment: TranscriptSegment; trigger: string; confidence: number } | null =
      null;

    for (const segment of segments) {
      if (segment.startMs < searchFromMs) continue;

      for (const pattern of patterns) {
        const match = segment.text.match(pattern);
        if (match) {
          const confidence = phaseDef.phase === "Hook" ? 0.9 : 0.75;
          if (!bestMatch || segment.startMs < bestMatch.segment.startMs) {
            bestMatch = {
              segment,
              trigger: match[0],
              confidence,
            };
          }
        }
      }
    }

    if (bestMatch) {
      markers.push({
        phase: phaseDef.phase,
        startMs: bestMatch.segment.startMs,
        timestamp: bestMatch.segment.timestamp,
        description: phaseDef.description,
        confidence: bestMatch.confidence,
        trigger: bestMatch.trigger,
      });
      searchFromMs = bestMatch.segment.startMs + 1;
    }
  }

  if (markers.length >= 2) {
    return markers;
  }

  const durationMs = segments[segments.length - 1].startMs;
  const phaseDurationMs = durationMs / GISH_GALLOP_PHASES.length;

  return GISH_GALLOP_PHASES.map((phase, index) => {
    const startMs = Math.round(index * phaseDurationMs);
    const nearest = segments.reduce((best, segment) => {
      const delta = Math.abs(segment.startMs - startMs);
      const bestDelta = Math.abs(best.startMs - startMs);
      return delta < bestDelta ? segment : best;
    }, segments[0]);

    return {
      phase: phase.phase,
      startMs: nearest.startMs,
      timestamp: nearest.timestamp,
      description: phase.description,
      confidence: 0.4,
      trigger: "duration-fallback",
    };
  });
}

function buildTechniqueScores(
  fullText: string,
  durationMinutes: number,
  claims: DetectedClaimResult[],
  firehoseHits: number,
  statisticMentions: number,
  topicShifts: number,
): TechniqueScore[] {
  const byTechnique = (technique: RhetoricTechnique) =>
    claims.filter((claim) => claim.technique === technique).length;

  const gallopClaims = byTechnique("GISH_GALLOP") + byTechnique("STATISTICAL_DISTORTION");
  const claimDensity = durationMinutes > 0 ? gallopClaims / durationMinutes : gallopClaims;
  const gallopScore = clamp(claimDensity * 18 + topicShifts * 2);

  const firehoseScore = clamp(firehoseHits * 14 + byTechnique("PREEMPTIVE_CLOSURE") * 10);
  const causalScore = clamp(
    byTechnique("CORRELATION_CAUSATION") * 16 + byTechnique("UNSUPPORTED_LEAP") * 12,
  );
  const statsScore = clamp(statisticMentions * 8 + byTechnique("STATISTICAL_DISTORTION") * 6);
  const strawmanScore = clamp(byTechnique("STRAWMAN") * 20);

  return [
    {
      technique: "GISH_GALLOP",
      score: gallopScore,
      severity: severityFromScore(gallopScore),
      title: "Gish Gallop",
      summary:
        "High volume of verifiable-sounding claims delivered faster than an audience can source or refute.",
      evidence: {
        claimDensityPerMinute: Number(claimDensity.toFixed(2)),
        verifiableAssertions: byTechnique("GISH_GALLOP"),
        topicShifts,
      },
    },
    {
      technique: "FIREHOSE",
      score: firehoseScore,
      severity: severityFromScore(firehoseScore),
      title: "Firehosing",
      summary:
        "Repetitive certainty phrases that substitute familiarity and social proof for evidence.",
      evidence: {
        phraseHits: firehoseHits,
        preemptiveClosures: byTechnique("PREEMPTIVE_CLOSURE"),
      },
    },
    {
      technique: "CORRELATION_CAUSATION",
      score: causalScore,
      severity: severityFromScore(causalScore),
      title: "Correlation → Causation",
      summary:
        "Co-occurring trends or anecdotes promoted to intentional causation or conspiracy.",
      evidence: {
        causalLeaps: byTechnique("CORRELATION_CAUSATION"),
        unsupportedLeaps: byTechnique("UNSUPPORTED_LEAP"),
      },
    },
    {
      technique: "STATISTICAL_DISTORTION",
      score: statsScore,
      severity: severityFromScore(statsScore),
      title: "Statistical Distortion",
      summary:
        "Percentages, ratios, and population claims without denominators, definitions, or sourcing.",
      evidence: {
        statisticMentions,
        flaggedClaims: byTechnique("STATISTICAL_DISTORTION"),
      },
    },
    {
      technique: "STRAWMAN",
      score: strawmanScore,
      severity: severityFromScore(strawmanScore),
      title: "Strawman / Media Misrepresentation",
      summary:
        "Opponents or media caricatured to heighten persecution framing.",
      evidence: {
        strawmanClaims: byTechnique("STRAWMAN"),
      },
    },
  ];
}

export function analyzeTranscript(
  segments: TranscriptSegment[],
  fullText: string,
  durationSeconds: number,
): AnalysisResult {
  const durationMinutes = Math.max(durationSeconds / 60, 1);
  const firehoseHits = findPhraseHits(segments, FIREHOSE_PHRASES).length;
  const statisticMentions = countMatches(fullText, STATISTIC_PATTERNS);
  const topicShifts = countMatches(fullText, TOPIC_SHIFT_MARKERS);
  const causalLeaps = findPhraseHits(segments, CAUSAL_LEAP_MARKERS).length;
  const claims = detectClaims(segments);
  const techniqueScores = buildTechniqueScores(
    fullText,
    durationMinutes,
    claims,
    firehoseHits,
    statisticMentions,
    topicShifts,
  );

  const overallScore = clamp(
    techniqueScores.reduce((sum, item) => sum + item.score, 0) /
      techniqueScores.length,
  );

  const topTechnique = [...techniqueScores].sort((a, b) => b.score - a.score)[0];
  const summary = `Detected ${claims.length} rhetorical flags across ${segments.length} transcript segments (~${Math.round(durationMinutes)} min). Strongest signal: ${topTechnique.title} (${Math.round(topTechnique.score)}/100). This is heuristic pattern detection — verify individual claims against primary sources.`;

  return {
    overallScore,
    summary,
    techniqueScores,
    claims: claims.slice(0, 120),
    phases: inferPhases(segments),
    metrics: {
      claimDensityPerMinute: Number(
        (
          claims.filter((c) =>
            ["GISH_GALLOP", "STATISTICAL_DISTORTION"].includes(c.technique),
          ).length / durationMinutes
        ).toFixed(2),
      ),
      statisticMentions,
      repetitionHits: firehoseHits,
      topicShifts,
      causalLeaps,
    },
  };
}

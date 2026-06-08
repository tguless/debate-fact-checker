import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Claim = {
  id: string;
  text: string;
  timestamp: string | null;
  technique: string;
  category: string;
  confidence: number;
  excerpt: string;
  reasoning: string;
  verdict?: string;
};

const verdictVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FALSE: "destructive",
  MISLEADING: "destructive",
  DISTORTED: "secondary",
  UNSUPPORTED: "outline",
  FLAGGED: "outline",
};

const techniqueLabels: Record<string, string> = {
  GISH_GALLOP: "Gish Gallop",
  FIREHOSE: "Firehose",
  CORRELATION_CAUSATION: "Correlation → Causation",
  STATISTICAL_DISTORTION: "Statistical Distortion",
  STRAWMAN: "Strawman",
  UNSUPPORTED_LEAP: "Unsupported Leap",
  PREEMPTIVE_CLOSURE: "Preemptive Closure",
};

export function ClaimList({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No rhetorical flags matched the current heuristics.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="border-border/60 bg-card/70">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium">
              {claim.timestamp ? `[${claim.timestamp}] ` : ""}
              <span className="text-primary">{claim.excerpt}</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {claim.verdict ? (
                <Badge variant={verdictVariant[claim.verdict] ?? "outline"}>
                  {claim.verdict}
                </Badge>
              ) : null}
              <Badge variant="secondary">
                {techniqueLabels[claim.technique] ?? claim.technique}
              </Badge>
              <Badge variant="outline">{Math.round(claim.confidence * 100)}% conf.</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="leading-relaxed break-words text-foreground">{claim.text}</p>
            <p className="leading-relaxed break-words text-muted-foreground">{claim.reasoning}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

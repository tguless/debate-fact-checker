import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PhaseMarker } from "@/lib/rhetoric/types";

export function PhaseTimeline({ phases }: { phases: PhaseMarker[] }) {
  if (phases.length === 0) return null;

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle className="text-base">Gish Gallop phase timeline</CardTitle>
        <CardDescription>
          Detected from topic-shift signals in the transcript, not even time buckets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {phases.map((phase, index) => (
            <div key={`${phase.phase}-${phase.startMs}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                {index < phases.length - 1 ? (
                  <div className="mt-1 w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{phase.phase}</span>
                  <Badge variant="outline">[{phase.timestamp}]</Badge>
                  <Badge variant="secondary">
                    {Math.round(phase.confidence * 100)}% match
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
                {phase.trigger ? (
                  <p className="font-mono text-xs text-primary">
                    Trigger: &quot;{phase.trigger}&quot;
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

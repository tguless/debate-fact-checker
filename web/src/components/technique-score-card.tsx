import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type TechniqueScoreCardProps = {
  title: string;
  score: number;
  severity: string;
  summary: string;
};

const severityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function TechniqueScoreCard({
  title,
  score,
  severity,
  summary,
}: TechniqueScoreCardProps) {
  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant={severityVariant[severity] ?? "outline"}>{severity}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Signal strength</span>
          <span className="font-medium text-foreground">{Math.round(score)}/100</span>
        </div>
        <Progress value={score} />
        <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}

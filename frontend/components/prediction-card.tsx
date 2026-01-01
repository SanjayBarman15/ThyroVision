import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PredictionCardProps {
  analysis: {
    tiradas: string;
    confidence: number;
    riskLevel: string;
  };
}

export default function PredictionCard({ analysis }: PredictionCardProps) {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "moderate":
        return "bg-amber-500/15 text-amber-400 border-amber-500/20";
      case "high":
        return "bg-orange-500/15 text-orange-400 border-orange-500/20";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    }
  };

  const riskColorClass = getRiskColor(analysis.riskLevel);

  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              AI Classification
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground tracking-tight">
                {analysis.tiradas}
              </span>
              <Badge
                variant="outline"
                className={`${riskColorClass} capitalize border`}
              >
                {analysis.riskLevel} Risk
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-[280px] leading-relaxed">
              ACR TI-RADS category – follow-up usually recommended based on size
              and features.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">
              Model Confidence
            </span>
            <span className="text-foreground font-mono">
              {Math.round(analysis.confidence * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${analysis.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

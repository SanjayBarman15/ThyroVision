import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { tiradsColors, getRiskLevelClass } from "@/lib/colors";

interface PredictionCardProps {
  analysis: {
    tirads: string;
    confidence: number;
    riskLevel: string;
  };
}

export default function PredictionCard({ analysis }: PredictionCardProps) {
  const [showDistribution, setShowDistribution] = useState(false);

  // Hardcoded data based on mock_json_output.json
  const chartData = [
    { category: "TR1", probability: 0.012, fill: "var(--color-tr1)" },
    { category: "TR2", probability: 0.038, fill: "var(--color-tr2)" },
    { category: "TR3", probability: 0.076, fill: "var(--color-tr3)" },
    { category: "TR4", probability: 0.847, fill: "var(--color-tr4)" },
    { category: "TR5", probability: 0.027, fill: "var(--color-tr5)" },
  ];

  const chartConfig = {
    probability: {
      label: "Probability",
    },
    tr1: {
      label: "TR1",
      color: tiradsColors.tr1,
    },
    tr2: {
      label: "TR2",
      color: tiradsColors.tr2,
    },
    tr3: {
      label: "TR3",
      color: tiradsColors.tr3,
    },
    tr4: {
      label: "TR4",
      color: tiradsColors.tr4,
    },
    tr5: {
      label: "TR5",
      color: tiradsColors.tr5,
    },
  } satisfies ChartConfig;

  const riskColorClass = getRiskLevelClass(analysis.riskLevel);

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
                {analysis.tirads}
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
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-muted-foreground font-medium">
              Model Confidence
            </span>
          </div>
          <div className="h-6 w-full bg-secondary/30 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-zinc-500 flex items-center justify-end px-2 transition-all duration-500"
              style={{ width: `${analysis.confidence * 100}%` }}
            >
              <span className="text-[10px] font-bold text-white font-mono leading-none">
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowDistribution(!showDistribution)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showDistribution ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <span className="font-medium">
              {showDistribution ? "Hide" : "Show"} Confidence Distribution
            </span>
          </button>

          {showDistribution && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <ChartContainer
                config={chartConfig}
                className="min-h-[150px] w-full"
              >
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dashed" />}
                    cursor={false}
                  />
                  <Bar dataKey="probability" radius={4}>
                    {/* Recharts might render fills from data automatically if properly structured or we can define color mapping */}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Probabilities across TI-RADS categories
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface ExplanationAccordionProps {
  analysis: {
    explanation: string;
    features: Record<string, string>;
    modelVersion?: string;
    inferenceTime?: number;
  };
}

export default function ExplanationAccordion({
  analysis,
}: ExplanationAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const showTechnicalDetails =
    process.env.NEXT_PUBLIC_AI_SHOW_TECHNICAL_DETAILS === "true";

  return (
    <Card className="border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors border-b border-border/50"
      >
        <h3 className="font-semibold text-sm text-foreground">
          AI Explanation
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 py-4 space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-3">
              {analysis.explanation}
            </p>
          </div>

          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">
              Detected Features
            </p>
            <div className="grid grid-cols-1 gap-y-2">
              {Object.entries(analysis.features).map(([key, value]) => (
                <div key={key} className="flex items-start text-sm group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 mr-2.5 group-hover:bg-primary transition-colors" />
                  <div className="flex-1 flex justify-between border-b border-dashed border-border/40 pb-1">
                    <span className="text-muted-foreground capitalize font-medium text-xs">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showTechnicalDetails &&
            (analysis.modelVersion || analysis.inferenceTime) && (
              <div className="pt-3 mt-2 border-t border-border/40 flex justify-between items-center text-[9px] text-muted-foreground/60 font-mono italic">
                <span>Engine: {analysis.modelVersion}</span>
                <span>Speed: {analysis.inferenceTime}ms</span>
              </div>
            )}
        </div>
      )}
    </Card>
  );
}

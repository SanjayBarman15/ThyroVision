"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface FeedbackFormProps {
  isLoading: boolean;
  onSubmit: () => void;
}

export default function FeedbackForm({
  isLoading,
  onSubmit,
}: FeedbackFormProps) {
  const [feedback, setFeedback] = useState({
    isCorrect: null as boolean | null,
    correctTirads: "",
    boundingBoxAccuracy: "" as string,
    confidenceLevel: "" as string,
    comments: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFeedback({
          isCorrect: null,
          correctTirads: "",
          boundingBoxAccuracy: "",
          confidenceLevel: "",
          comments: "",
        });
      }, 2000);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Feedback recorded
          </p>
          <p className="text-xs text-emerald-500/70">
            Thank you for your input.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/10 rounded-lg p-4 border border-border/40">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Clinical Feedback
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          Validate the AI prediction to improve future accuracy.
        </p>
      </div>

      <div className="space-y-4">
        {/* Classification Correctness */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <p className="text-xs text-muted-foreground font-medium">
            TIRADS Correct?
          </p>
          <div className="flex gap-2">
            <Button
              variant={feedback.isCorrect === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedback((f) => ({ ...f, isCorrect: true }))}
              className={`h-7 text-xs flex-1 ${
                feedback.isCorrect === true
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-xs"
              }`}
            >
              Yes
            </Button>
            <Button
              variant={feedback.isCorrect === false ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedback((f) => ({ ...f, isCorrect: false }))}
              className={`h-7 text-xs flex-1 ${
                feedback.isCorrect === false
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-xs"
              }`}
            >
              No
            </Button>
          </div>
        </div>

        {/* Detailed Fields - Only show if interacted or expanded logic could be used here, but keeping simple */}

        <div className="space-y-3 pt-2 border-t border-dashed border-border/40">
          {/* Bounding Box Accuracy */}
          <div>
            <p className="text-[10px] uppercase text-muted-foreground mb-2 font-semibold">
              Bounding Box Accuracy
            </p>
            <div className="flex gap-1.5">
              {["Correct", "Partial", "Incorrect"].map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setFeedback((f) => ({ ...f, boundingBoxAccuracy: option }))
                  }
                  className={`px-3 py-1.5 rounded text-[10px] border transition-colors ${
                    feedback.boundingBoxAccuracy === option
                      ? "bg-secondary text-secondary-foreground border-secondary-foreground/20"
                      : "bg-transparent text-muted-foreground border-border hover:bg-secondary/20"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Comments - Optional */}
          <div>
            <textarea
              value={feedback.comments}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, comments: e.target.value }))
              }
              placeholder="Optional clinical notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-border bg-background/50 text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          size="sm"
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs h-8 border border-secondary-foreground/10"
        >
          {isLoading ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}

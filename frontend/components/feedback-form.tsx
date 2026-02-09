"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronDown,
  Check,
  X,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { feedbackFormClasses } from "@/lib/colors";

interface FeedbackFormProps {
  predictionId: string;
  existingFeedback?: any;
  onSuccess?: () => void;
}

export default function FeedbackForm({
  predictionId,
  existingFeedback,
  onSuccess,
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctedTirads, setCorrectedTirads] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [incorrectFeatures, setIncorrectFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Initialize from existing feedback if provided
  useEffect(() => {
    if (existingFeedback) {
      setSubmitted(true);
      setIsCorrect(existingFeedback.is_correct);
      setCorrectedTirads(existingFeedback.corrected_tirads);
      setComments(existingFeedback.comments || "");
      if (existingFeedback.corrected_features?.incorrect_fields) {
        setIncorrectFeatures(
          existingFeedback.corrected_features.incorrect_fields
        );
      }
    }
  }, [existingFeedback]);

  const toggleFeature = (feature: string) => {
    setIncorrectFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = async () => {
    if (isCorrect === null) return;
    if (isCorrect === false && correctedTirads === null) {
      setError("Please select the correct TI-RADS level.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const response = await fetch(
        `${backendUrl}/predictions/${predictionId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_correct: isCorrect,
            corrected_tirads: isCorrect ? null : correctedTirads,
            corrected_features: isCorrect
              ? null
              : {
                  incorrect_fields: incorrectFeatures,
                },
            comments: comments || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${feedbackFormClasses.success.container} rounded-xl p-4 flex items-center gap-3 animate-in fade-in zoom-in duration-300`}>
        <div className={`h-8 w-8 rounded-full ${feedbackFormClasses.success.iconBg} flex items-center justify-center`}>
          <CheckCircle2 className={`h-5 w-5 ${feedbackFormClasses.success.icon}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${feedbackFormClasses.success.title}`}>
            Feedback Recorded
          </p>
          <p className={`text-xs ${feedbackFormClasses.success.subtitle}`}>
            Thank you for helping us improve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          Clinical Feedback
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium px-2 py-0.5 bg-secondary/30 rounded-full border border-border/50">
          Improve Accuracy
        </span>
      </div>

      <div className="bg-secondary/10 rounded-xl p-4 border border-border/40 space-y-4 transition-all duration-300">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            Was the AI prediction correct for this scan?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCorrect(true);
                setError(null);
              }}
              className={`h-10 rounded-lg border-2 transition-all ${
                isCorrect === true
                  ? `${feedbackFormClasses.correct.bg} ${feedbackFormClasses.correct.border} ${feedbackFormClasses.correct.text} ${feedbackFormClasses.correct.hover}`
                  : "border-border hover:bg-secondary/30"
              }`}
            >
              <Check className="h-4 w-4 mr-2" />
              Yes, Correct
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCorrect(false);
                setError(null);
              }}
              className={`h-10 rounded-lg border-2 transition-all ${
                isCorrect === false
                  ? `${feedbackFormClasses.incorrect.bg} ${feedbackFormClasses.incorrect.border} ${feedbackFormClasses.incorrect.text} ${feedbackFormClasses.incorrect.hover}`
                  : "border-border hover:bg-secondary/30"
              }`}
            >
              <X className="h-4 w-4 mr-2" />
              No, Incorrect
            </Button>
          </div>
        </div>

        {/* Conditional Fields */}
        {isCorrect === false && (
          <div className="space-y-4 pt-4 border-t border-dashed border-border/60 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                Correct TI-RADS Level
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 border-border bg-background/50"
                  >
                    {correctedTirads ? `TR${correctedTirads}` : "Select Level"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-3rem)] max-w-[300px] bg-popover/95 backdrop-blur-sm border-border">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <DropdownMenuItem
                      key={val}
                      onClick={() => setCorrectedTirads(val)}
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      TI-RADS {val}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                Incorrect Features (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Composition",
                  "Echogenicity",
                  "Margins",
                  "Calcifications",
                  "Shape",
                ].map((feature) => (
                  <button
                    key={feature}
                    onClick={() => toggleFeature(feature)}
                    className={`px-3 py-1.5 rounded-full text-[10px] border transition-all ${
                      incorrectFeatures.includes(feature)
                        ? feedbackFormClasses.incorrectFeature.active
                        : "bg-background/50 border-border text-muted-foreground hover:border-muted-foreground/50"
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                Clinical Notes (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What did the AI miss?"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              />
            </div>
          </div>
        )}

        {error && (
          <div className={`flex items-center gap-2 ${feedbackFormClasses.error.text} ${feedbackFormClasses.error.container} p-2 rounded-lg border animate-in fade-in duration-200`}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[10px] font-medium leading-tight">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isCorrect === null}
          className={`w-full h-10 rounded-lg font-bold text-xs shadow-lg transition-all active:scale-[0.98] ${
            isCorrect === null
              ? "bg-secondary text-muted-foreground opacity-50"
              : "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30"
          }`}
        >
          {isSubmitting ? "Saving..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}

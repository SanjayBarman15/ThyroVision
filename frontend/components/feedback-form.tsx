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
  Sparkles,
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

  useEffect(() => {
    if (existingFeedback) {
      setSubmitted(true);
      setIsCorrect(existingFeedback.is_correct);
      setCorrectedTirads(existingFeedback.corrected_tirads);
      setComments(existingFeedback.comments || "");
      if (existingFeedback.corrected_features?.incorrect_fields) {
        setIncorrectFeatures(
          existingFeedback.corrected_features.incorrect_fields,
        );
      }
    }
  }, [existingFeedback]);

  const toggleFeature = (feature: string) => {
    setIncorrectFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature],
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

      const backendUrl = "/api/proxy";

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
        },
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
      <div
        className={`${feedbackFormClasses.success.container} rounded-2xl p-5 flex items-center gap-4 shadow-lg border-2`}
      >
        <div
          className={`h-12 w-12 rounded-xl ${feedbackFormClasses.success.iconBg} flex items-center justify-center shrink-0`}
        >
          <CheckCircle2
            className={`h-6 w-6 ${feedbackFormClasses.success.icon}`}
          />
        </div>
        <div className="min-w-0">
          <p
            className={`text-base font-bold ${feedbackFormClasses.success.title}`}
          >
            Feedback recorded
          </p>
          <p
            className={`text-sm ${feedbackFormClasses.success.subtitle} mt-0.5`}
          >
            Thank you for helping us improve model accuracy.
          </p>
        </div>
      </div>
    );
  }

  const features = [
    "Composition",
    "Echogenicity",
    "Margins",
    "Calcifications",
    "Shape",
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 shadow-xl overflow-hidden">
      {/* Header strip */}
      <div className="bg-primary/5 border-b border-border/50 px-5 py-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <MessageSquare className="h-4 w-4" />
          </span>
          Clinical feedback
        </h3>
        <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Improves accuracy
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-foreground mb-3">
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
              className={`cursor-pointer h-11 rounded-xl border-2 transition-all font-medium ${
                isCorrect === true
                  ? `${feedbackFormClasses.correct.bg} ${feedbackFormClasses.correct.border} ${feedbackFormClasses.correct.text} ${feedbackFormClasses.correct.hover}`
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Check className="h-4 w-4 mr-2" />
              Yes, correct
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCorrect(false);
                setError(null);
              }}
              className={`cursor-pointer h-11 rounded-xl border-2 transition-all font-medium ${
                isCorrect === false
                  ? `${feedbackFormClasses.incorrect.bg} ${feedbackFormClasses.incorrect.border} ${feedbackFormClasses.incorrect.text} ${feedbackFormClasses.incorrect.hover}`
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <X className="h-4 w-4 mr-2" />
              No, incorrect
            </Button>
          </div>
        </div>

        {isCorrect === false && (
          <div className="space-y-4 pt-4 border-t border-dashed border-border/60">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Correct TI-RADS level
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-11 rounded-xl border-border bg-background/50 font-medium"
                  >
                    {correctedTirads ? `TR${correctedTirads}` : "Select level"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) max-w-[300px] rounded-xl border-border bg-popover"
                  align="start"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <DropdownMenuItem
                      key={val}
                      onClick={() => setCorrectedTirads(val)}
                      className="cursor-pointer rounded-lg font-medium"
                    >
                      TI-RADS {val}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                Incorrect features (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      incorrectFeatures.includes(feature)
                        ? feedbackFormClasses.incorrectFeature.active
                        : "bg-muted/30 border-border text-muted-foreground hover:border-muted-foreground/40"
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                Clinical notes (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What did the AI miss? Any additional context..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all"
              />
            </div>
          </div>
        )}

        {error && (
          <div
            className={`flex items-center gap-2 ${feedbackFormClasses.error.container} ${feedbackFormClasses.error.text} p-3 rounded-xl border`}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isCorrect === null}
          className={`w-full h-11 rounded-xl font-bold text-sm transition-all ${
            isCorrect === null
              ? "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
          }`}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Saving…
            </span>
          ) : (
            "Submit review"
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import type React from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { warningClasses } from "@/lib/colors";

interface PatientData {
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  past_medical_data: string;
}

interface StepReviewProps {
  data: PatientData;
  file: File | null;
  previewUrl: string | null;
  useLlm: boolean;
  onToggleLlm: (val: boolean) => void;
}

export const StepReview = ({
  data,
  file,
  previewUrl,
  useLlm,
  onToggleLlm,
}: StepReviewProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-primary mb-2">
        <CheckCircle2 className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Review Information</h3>
      </div>

      <Card className="overflow-hidden border-border bg-background/40 divide-y divide-border">
        {/* ... (Existing patient details and medical data) ... */}
        <div className="p-4 bg-muted/30">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter mb-4">
            Patient Details
          </p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">
                Full Name
              </Label>
              <p className="text-sm font-semibold truncate">
                {data.first_name} {data.last_name}
              </p>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">
                Gender
              </Label>
              <p className="text-sm font-semibold">
                {data.gender === "M"
                  ? "Male"
                  : data.gender === "F"
                    ? "Female"
                    : "Other"}
              </p>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">
                Date of Birth
              </Label>
              <p className="text-sm font-semibold">{data.dob}</p>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">
                Age
              </Label>
              <p className="text-sm font-semibold">
                {data.dob
                  ? new Date().getFullYear() - new Date(data.dob).getFullYear()
                  : "N/A"}{" "}
                yrs
              </p>
            </div>
          </div>
        </div>

        {data.past_medical_data && (
          <div className="p-4">
            <Label className="text-[10px] text-muted-foreground uppercase block mb-1">
              Medical Data
            </Label>
            <p className="text-xs text-foreground/80 leading-relaxed italic line-clamp-3">
              "{data.past_medical_data}"
            </p>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-[10px] text-muted-foreground uppercase">
              Attached Scan
            </Label>
            <span className="text-[10px] font-mono text-muted-foreground">
              {file ? (file.size / 1024 / 1024).toFixed(2) : "0"} MB
            </span>
          </div>
          {previewUrl && (
            <div className="h-24 w-32 rounded border border-border bg-black mx-auto overflow-hidden">
              <img
                src={previewUrl}
                alt="Review thumb"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          )}
        </div>
      </Card>

      {/* AI Explanation Toggle */}
      <div
        className="p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
        onClick={() => onToggleLlm(!useLlm)}
      >
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            <Checkbox
              id="ai-toggle"
              checked={useLlm}
              onCheckedChange={(checked: boolean) => onToggleLlm(!!checked)}
              className="mt-1 border-primary/50 data-[state=checked]:bg-primary"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="ai-toggle"
              className="text-sm font-bold flex items-center gap-2 text-primary cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 fill-primary/20" />
              AI Clinical Explanation
            </Label>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Request a natural language summary powered by Gemini. Leave
              unchecked for standard rule-based results.
            </p>
          </div>
        </div>
      </div>

      <div className={`flex items-start gap-2 p-3 rounded-lg ${warningClasses.container}`}>
        <AlertCircle className={`h-4 w-4 ${warningClasses.icon} mt-0.5`} />
        <p className={`text-[11px] ${warningClasses.text} leading-snug`}>
          AI generated content should be verified by a clinician. Rule-based
          analysis remains our primary diagnostic baseline.
        </p>
      </div>
    </div>
  );
};

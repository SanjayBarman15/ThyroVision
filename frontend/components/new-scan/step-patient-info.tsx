"use client";

import type React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Calendar, FileText } from "lucide-react";

interface PatientData {
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  past_medical_data: string;
}

interface StepPatientInfoProps {
  data: PatientData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onToggleMedical: () => void;
  showMedical: boolean;
}

export const StepPatientInfo = ({
  data,
  onChange,
  onToggleMedical,
  showMedical,
}: StepPatientInfoProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-primary mb-2">
        <User className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Patient Information</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-sm font-medium">
            First Name *
          </Label>
          <Input
            id="first_name"
            name="first_name"
            value={data.first_name}
            onChange={onChange}
            placeholder="Jane"
            className="bg-background border-border transition-all focus:ring-2 focus:ring-primary/20"
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-sm font-medium">
            Last Name *
          </Label>
          <Input
            id="last_name"
            name="last_name"
            value={data.last_name}
            onChange={onChange}
            placeholder="Doe"
            className="bg-background border-border transition-all focus:ring-2 focus:ring-primary/20"
            aria-required="true"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="dob"
            className="text-sm font-medium flex items-center gap-1"
          >
            <Calendar className="h-3.5 w-3.5" /> Date of Birth *
          </Label>
          <Input
            id="dob"
            name="dob"
            type="date"
            value={data.dob}
            onChange={onChange}
            max={new Date().toISOString().split("T")[0]}
            className="bg-background border-border transition-all focus:ring-2 focus:ring-primary/20"
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-medium">
            Gender *
          </Label>
          <select
            id="gender"
            name="gender"
            value={data.gender}
            onChange={onChange}
            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            aria-required="true"
          >
            <option value="">Select Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onToggleMedical}
          className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 font-medium group transition-colors"
        >
          <div
            className={`p-1 rounded bg-secondary/10 group-hover:bg-secondary/20 transition-colors`}
          >
            <FileText className="h-4 w-4" />
          </div>
          {showMedical
            ? "Hide Past Medical Data"
            : "Add Past Medical Data (Optional)"}
        </button>
        {showMedical && (
          <textarea
            name="past_medical_data"
            value={data.past_medical_data}
            onChange={onChange}
            placeholder="Any relevant history, allergies, or prior conditions..."
            rows={4}
            className="w-full p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none animate-in zoom-in-95 duration-200"
          />
        )}
      </div>
    </div>
  );
};

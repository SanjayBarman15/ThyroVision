"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, X, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface NewScanPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: () => void;
}

export default function NewScanPanel({
  isOpen,
  onClose,
  onScanComplete,
}: NewScanPanelProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    past_medical_data: "",
    imageFile: null as File | null,
  });
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imageFile: file }));
    }
  };

  const isStep1Valid =
    formData.first_name &&
    formData.last_name &&
    formData.dob &&
    formData.gender;
  const isStep2Valid = formData.imageFile !== null;
  const isStep3Valid = isStep1Valid && isStep2Valid;

  const handleSubmit = async () => {
    if (isStep3Valid) {
      setIsLoading(true);
      try {
        // 1. Get current authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("You must be logged in to create a patient.");
        }

        // 2. Resolve Doctor ID
        // Based on schema: doctors.id IS the auth.users.id
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("id")
          .eq("id", user.id)
          .single();

        if (doctorError || !doctorData) {
          console.error("Doctor lookup error:", doctorError);
          throw new Error(
            "Could not find a doctor profile associated with your account. Please ensuring you have completed profile setup."
          );
        }

        // 3. Insert Patient Data
        // TODO: Upload image to Storage and link it here
        const { error: insertError } = await supabase.from("patients").insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          dob: formData.dob,
          gender: formData.gender,
          past_medical_data: formData.past_medical_data,
          doctor_id: user.id, // Using user.id directly as it matches doctor.id
        });

        if (insertError) {
          console.error("Insertion error:", insertError);
          throw new Error("Failed to create patient: " + insertError.message);
        }

        toast.success("Patient created successfully");
        if (onScanComplete) {
          onScanComplete();
        }
        handleClose();
        // Option: Redirect or refresh list
        // router.push("/analysis/1");
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      first_name: "",
      last_name: "",
      dob: "",
      gender: "",
      past_medical_data: "",
      imageFile: null,
    });
    setShowMedicalHistory(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-lg transform transition-transform">
        {/* Header */}
        <div className="sticky top-0 border-b border-border bg-card p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">New Scan</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Step {step} of 3</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">
                Patient Information
              </h3>

              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label
                      htmlFor="first_name"
                      className="text-sm font-medium text-foreground mb-2 block"
                    >
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="last_name"
                      className="text-sm font-medium text-foreground mb-2 block"
                    >
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="dob"
                      className="text-sm font-medium text-foreground mb-2 block"
                    >
                      Date of Birth *
                    </Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="gender"
                      className="text-sm font-medium text-foreground mb-2 block"
                    >
                      Gender *
                    </Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm"
                    >
                      <option value="">Select</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Medical History Collapsible */}
              <div>
                <button
                  onClick={() => setShowMedicalHistory(!showMedicalHistory)}
                  className="text-sm text-secondary hover:text-secondary/80 font-medium"
                >
                  {showMedicalHistory ? "▼" : "▶"} Add Past Medical Data
                  (optional)
                </button>
                {showMedicalHistory && (
                  <textarea
                    name="past_medical_data"
                    value={formData.past_medical_data}
                    onChange={handleInputChange}
                    placeholder="Relevant medical history..."
                    rows={3}
                    className="mt-3 w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm"
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">
                Upload Ultrasound Image
              </h3>

              <div>
                <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background/50 p-8 cursor-pointer transition-colors hover:border-secondary">
                  <Upload className="h-8 w-8 text-secondary" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {formData.imageFile
                        ? "File selected"
                        : "Drag and drop or click to select"}
                    </p>
                    {formData.imageFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.imageFile.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, DICOM up to 50MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.imageFile && (
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="aspect-square rounded-md bg-background flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      Image preview placeholder
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">
                Review & Confirm
              </h3>

              <Card className="border-border bg-background/50 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Patient Name</p>
                  <p className="font-medium text-foreground">
                    {formData.first_name} {formData.last_name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Date of Birth
                    </p>
                    <p className="font-medium text-foreground">
                      {formData.dob}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium text-foreground">
                      {formData.gender}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Image</p>
                  <p className="font-medium text-foreground">
                    {formData.imageFile?.name || "No image"}
                  </p>
                </div>
              </Card>

              <p className="text-xs text-muted-foreground">
                Click confirm to start AI analysis. This typically takes 30-60
                seconds.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-card p-6 flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="border-border flex-1 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
            >
              {isLoading ? "Saving..." : "Save Patient"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

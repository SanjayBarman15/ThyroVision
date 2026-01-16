"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// Import step components
import { StepPatientInfo } from "./new-scan/step-patient-info";
import { StepUploadImage } from "./new-scan/step-upload-image";
import { StepReview } from "./new-scan/step-review";

// --- Types ---

interface PatientData {
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  past_medical_data: string;
}

interface NewScanPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: () => void;
}

// --- Main Component ---

export default function NewScanPanel({
  isOpen,
  onClose,
  onScanComplete,
}: NewScanPanelProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<PatientData>({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    past_medical_data: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- Handlers ---

  const handleClose = useCallback(() => {
    setStep(1);
    setFormData({
      first_name: "",
      last_name: "",
      dob: "",
      gender: "",
      past_medical_data: "",
    });
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setShowMedical(false);
    setCreatedPatientId(null);
    onClose();
  }, [onClose, previewUrl]);

  // Handle image preview lifecycle
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleFileChange = useCallback((file: File) => {
    // Validation
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/dicom",
    ];
    const isDcm = file.name.toLowerCase().endsWith(".dcm");

    if (!allowedTypes.includes(file.type) && !isDcm) {
      toast.error("Invalid file type. Please upload PNG, JPG, or DICOM.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit.");
      return;
    }

    setImageFile(file);
    toast.success("Image selected successfully");
  }, []);

  const validateStep = useCallback(
    (currentStep: number) => {
      if (currentStep === 1) {
        return !!(
          formData.first_name &&
          formData.last_name &&
          formData.dob &&
          formData.gender
        );
      }
      if (currentStep === 2) {
        return !!imageFile;
      }
      return true;
    },
    [formData, imageFile]
  );

  const handleNext = useCallback(() => {
    if (step === 1 && new Date(formData.dob) > new Date()) {
      toast.error("Date of birth cannot be in the future");
      return;
    }
    if (step < 3 && validateStep(step)) {
      setStep(step + 1);
    }
  }, [step, validateStep, formData.dob]);

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setIsLoading(true);
    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !session)
        throw new Error("Authentication failed. Please log in again.");

      const token = session.access_token;
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      // 1. Create Patient (skip if already created during retry)
      let patientId = createdPatientId;
      if (!patientId) {
        const patientResponse = await fetch(`${backendUrl}/patients/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!patientResponse.ok) {
          const err = await patientResponse.json();
          const detail =
            typeof err.detail === "string"
              ? err.detail
              : JSON.stringify(err.detail);
          throw new Error(detail || "Failed to create patient record");
        }

        const res = await patientResponse.json();
        patientId = res.patient.id;
        setCreatedPatientId(patientId);
      }

      // 2. Upload Image
      const imageFormData = new FormData();
      imageFormData.append("patient_id", patientId as string);
      imageFormData.append("file", imageFile!);

      const imageResponse = await fetch(`${backendUrl}/images/upload-raw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const err = await imageResponse.json();
        const detail =
          typeof err.detail === "string"
            ? err.detail
            : JSON.stringify(err.detail);
        throw new Error(
          `Profile created, but image upload failed: ${
            detail || imageResponse.statusText
          }`
        );
      }

      const imageData = await imageResponse.json();
      const imageId = imageData.image_id;

      // 3. Trigger Inference
      toast.info("Starting AI Analysis...", {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
      });
      const inferenceResponse = await fetch(`${backendUrl}/inference/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_id: imageId }),
      });

      if (!inferenceResponse.ok) {
        const err = await inferenceResponse.json();
        const detail =
          typeof err.detail === "string"
            ? err.detail
            : JSON.stringify(err.detail);
        throw new Error(
          `Upload success, but AI analysis failed: ${detail || "Unknown error"}`
        );
      }

      toast.success("Analysis complete! Scan is ready for review.");
      if (onScanComplete) onScanComplete();
      handleClose();
      // Redirect to analysis page for this patient
      router.push(`/analysis/${patientId}`);
      router.refresh();
    } catch (error: any) {
      console.error("[SubmissionError]", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Enter" && !isLoading) {
        if (step < 3) handleNext();
        else handleSubmit();
      }
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, handleNext, handleSubmit, handleClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-title"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-lg flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-500 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10 transition-all">
          <div className="space-y-1">
            <h2
              id="panel-title"
              className="text-2xl font-bold text-foreground flex items-center gap-3"
            >
              New Scan
              {isLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              ThyroVision Intelligent Analysis
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Dynamic Step Indicator */}
        <div className="px-6 py-5 bg-muted/20">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex flex-col gap-2">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                    s <= step
                      ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                      : "bg-border"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold uppercase ${
                    s === step
                      ? "text-primary"
                      : "text-muted-foreground opacity-50"
                  }`}
                >
                  Step {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-md mx-auto h-full">
            {step === 1 && (
              <StepPatientInfo
                data={formData}
                onChange={handleInputChange}
                onToggleMedical={() => setShowMedical(!showMedical)}
                showMedical={showMedical}
              />
            )}
            {step === 2 && (
              <StepUploadImage
                file={imageFile}
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
              />
            )}
            {step === 3 && (
              <StepReview
                data={formData}
                file={imageFile}
                previewUrl={previewUrl}
              />
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 bg-card border-t border-border flex items-center justify-between gap-4 sticky bottom-0 z-10 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
          <div className="flex-1 flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
                className="flex-1 h-12 gap-2 border-border hover:bg-muted transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(step)}
                className="flex-[2px] h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-[2px] h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 transition-all active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {createdPatientId ? "Retrying Upload..." : "Finalizing..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {createdPatientId ? "Complete Upload" : "Start Analysis"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

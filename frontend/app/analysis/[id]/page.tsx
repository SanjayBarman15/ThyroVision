"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useCallback, useState, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import SplitPane from "@/components/split-pane";
import PatientInfoCard from "@/components/patient-info-card";
import PredictionCard from "@/components/prediction-card";
import ExplanationAccordion from "@/components/explanation-accordion";
import FeedbackForm from "@/components/feedback-form";
import ImageViewer from "@/components/image-viewer";
import Header from "@/components/header";

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageMode, setImageMode] = useState<"original" | "processed">(
    "processed"
  );

  const [patient, setPatient] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [rawImage, setRawImage] = useState<any>(null);
  const [processedImage, setProcessedImage] = useState<any>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch Patient
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientData) {
        setPatient({
          id: patientData.id,
          name: `${patientData.first_name} ${patientData.last_name}`,
          age:
            patientData.age ||
            (patientData.dob
              ? new Date().getFullYear() -
                new Date(patientData.dob).getFullYear()
              : "N/A"),
          gender: patientData.gender === "M" ? "Male" : "Female",
          scanDate: new Date(patientData.created_at).toLocaleDateString(),
        });
      }

      // 2. Fetch Latest Raw Image
      const { data: rawImageData } = await supabase
        .from("raw_images")
        .select("*")
        .eq("patient_id", id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .single();

      if (rawImageData) {
        setRawImage(rawImageData);

        // 3. Fetch Prediction
        const { data: predData } = await supabase
          .from("predictions")
          .select("*")
          .eq("raw_image_id", rawImageData.id)
          .single();

        if (predData) {
          setAnalysis({
            tiradas: `TR${predData.tirads}`,
            confidence: predData.confidence,
            riskLevel:
              predData.tirads >= 4
                ? "high"
                : predData.tirads >= 3
                ? "moderate"
                : "low",
            explanation: `Mock explanation for TI-RADS ${predData.tirads}. The model version used was ${predData.model_version}. Inference took ${predData.inference_time_ms}ms.`,
            features: {
              composition: "Solid",
              echogenicity: "Hypoechoic",
              margins: "Irregular",
              calcifications: "None",
              shape: "Taller-than-wide",
            },
          });
        }

        // 4. Fetch Processed Image
        const { data: procImageData } = await supabase
          .from("processed_images")
          .select("*")
          .eq("raw_image_id", rawImageData.id)
          .single();

        if (procImageData) {
          setProcessedImage(procImageData);
        }
      }
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleZoomIn = () =>
    setZoomLevel((prev: number) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () =>
    setZoomLevel((prev: number) => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setZoomLevel(1);
    setImageMode("original");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="flex gap-4 h-full">
          <Skeleton className="w-1/3 h-full" />
          <Skeleton className="flex-1 h-full" />
        </div>
      </div>
    );
  }

  if (!patient) return <div>Patient not found</div>;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Header patientName={patient.name} scanDate={patient.scanDate} />

      <main className="flex-1 overflow-hidden relative">
        <SplitPane>
          {/* LEFT PANEL - Scrollable Info */}
          <div className="h-full overflow-y-auto p-4 space-y-4 pb-20 custom-scrollbar">
            <PatientInfoCard patient={patient} />
            {analysis ? (
              <>
                <PredictionCard analysis={analysis} />
                <ExplanationAccordion analysis={analysis} />
              </>
            ) : (
              <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                No AI analysis results found for this scan.
              </div>
            )}
            <div className="pt-4 border-t border-border mt-6">
              <FeedbackForm
                isLoading={isLoading}
                onSubmit={() => setIsLoading(true)}
              />
            </div>
          </div>

          {/* RIGHT PANEL - Image Workspace */}
          <div className="h-full bg-black/90 relative flex flex-col">
            <ImageViewer
              zoomLevel={zoomLevel}
              imageMode={imageMode}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              onModeChange={setImageMode}
              // Pass real image URLs
              imageUrl={
                imageMode === "original"
                  ? rawImage?.file_url
                  : processedImage?.file_url || rawImage?.file_url
              }
            />
          </div>
        </SplitPane>
      </main>
    </div>
  );
}

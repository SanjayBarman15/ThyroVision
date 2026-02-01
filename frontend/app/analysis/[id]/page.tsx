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
    "processed",
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
        console.log("📂 Raw Image From DB:", rawImageData.file_url);
        setRawImage(rawImageData);

        // 3. Fetch Prediction
        const { data: predData } = await supabase
          .from("predictions")
          .select("*")
          .eq("raw_image_id", rawImageData.id)
          .single();

        console.log("🔍 Prediction Data Received:", predData);

        if (predData) {
          setAnalysis({
            tirads: `TR${predData.tirads}`,
            confidence: predData.confidence,
            riskLevel:
              predData.tirads >= 4
                ? "high"
                : predData.tirads >= 3
                  ? "moderate"
                  : "low",
            explanation:
              predData.ai_explanation ||
              `Nodule analysis complete. TI-RADS ${predData.tirads} assigned.`,
            features: predData.features || {
              composition: "N/A",
              echogenicity: "N/A",
              margins: "N/A",
              calcifications: "N/A",
              shape: "N/A",
            },
            boundingBox: predData.bounding_box,
            predictionId: predData.id,
            modelVersion: predData.model_version,
            inferenceTime: predData.inference_time_ms,
          });
        }

        // 4. Fetch Processed Image
        const { data: procImageData } = await supabase
          .from("processed_images")
          .select("*")
          .eq("raw_image_id", rawImageData.id)
          .single();

        console.log("🔮 Processed Image From DB:", procImageData);

        if (procImageData) {
          setProcessedImage(procImageData);
        }

        // 5. Fetch Existing Feedback
        if (predData) {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;
            const backendUrl =
              process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

            const feedbackRes = await fetch(
              `${backendUrl}/predictions/${predData.id}/feedback`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            if (feedbackRes.ok) {
              const data = await feedbackRes.json();
              if (data.feedback) {
                setAnalysis((prev: any) => ({
                  ...prev,
                  existingFeedback: data.feedback,
                }));
              }
            }
          } catch (err) {
            console.error("Error fetching existing feedback:", err);
          }
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

  const handleZoomIn = useCallback(
    () => setZoomLevel((prev: number) => Math.min(prev + 0.3, 4)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoomLevel((prev: number) => Math.max(prev - 0.5, 0.5)),
    [],
  );
  const handleZoomScale = useCallback(
    (delta: number) =>
      setZoomLevel((prev: number) => {
        const newZoom = prev + delta;
        return Math.min(Math.max(newZoom, 0.5), 4);
      }),
    [],
  );
  const handleReset = useCallback(() => {
    setZoomLevel(1);
    setImageMode("original");
  }, []);

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

  const currentImageUrl = rawImage?.file_url;

  console.log(
    `🖼️ ImageViewer Mode: ${imageMode} | Base Image:`,
    currentImageUrl,
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Header
        patientName={patient.name}
        scanDate={patient.scanDate}
        predictionId={analysis?.predictionId}
      />

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
                predictionId={analysis?.predictionId}
                existingFeedback={analysis?.existingFeedback}
                onSuccess={() => console.log("Feedback submitted successfully")}
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
              onZoomScale={handleZoomScale}
              // Pass real image URLs
              imageUrl={currentImageUrl}
              boundingBox={analysis?.boundingBox}
            />
          </div>
        </SplitPane>
      </main>
    </div>
  );
}

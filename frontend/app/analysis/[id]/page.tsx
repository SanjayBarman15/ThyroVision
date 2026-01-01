"use client";

import { useState } from "react";
import SplitPane from "@/components/split-pane";
import PatientInfoCard from "@/components/patient-info-card";
import PredictionCard from "@/components/prediction-card";
import ExplanationAccordion from "@/components/explanation-accordion";
import FeedbackForm from "@/components/feedback-form";
import ImageViewer from "@/components/image-viewer";
import Header from "@/components/header";

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageMode, setImageMode] = useState<"original" | "processed">(
    "processed"
  );

  // Mock patient and analysis data
  const patient = {
    id: params.id,
    name: "Eleanor Pena", // Updated mock name for variety or keep existing
    age: 58,
    gender: "Female",
    scanDate: "Oct 24, 2023 • 14:30 PM",
  };

  const analysis = {
    tiradas: "TR4",
    confidence: 0.92,
    riskLevel: "moderate",
    explanation:
      "The nodule demonstrates a mixed composition with predominantly solid components and some cystic elements. Size is approximately 1.5 cm in the right lobe, lower pole. Echogenicity is slightly hypoechoic compared to thyroid parenchyma. No evidence of extrathyroidal extension or suspicious lymph nodes identified.",
    features: {
      composition: "Solid",
      echogenicity: "Hypoechoic",
      margins: "Irregular",
      calcifications: "None",
      shape: "Taller-than-wide",
    },
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setZoomLevel(1);
    setImageMode("original");
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Header patientName={patient.name} scanDate={patient.scanDate} />

      <main className="flex-1 overflow-hidden relative">
        <SplitPane>
          {/* LEFT PANEL - Scrollable Info */}
          <div className="h-full overflow-y-auto p-4 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <PatientInfoCard patient={patient} />
            <PredictionCard analysis={analysis} />
            <ExplanationAccordion analysis={analysis} />
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
            />
          </div>
        </SplitPane>
      </main>
    </div>
  );
}

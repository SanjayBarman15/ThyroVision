import LoadingState from "@/components/ui/loading-state";

export default function AnalysisLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <LoadingState
        message="Analyzing Ultrasound"
        detail="Running AI inference on scan images..."
      />
    </div>
  );
}

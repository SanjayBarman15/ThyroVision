import LoadingState from "@/components/ui/loading-state";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingState
        message="Booting ThyroVision"
        detail="Synchronizing diagnostic modules..."
      />
    </div>
  );
}

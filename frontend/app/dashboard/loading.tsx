import LoadingState from "@/components/ui/loading-state";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <LoadingState
        message="Loading Records"
        detail="Fetching patient data from clinical database..."
      />
    </div>
  );
}

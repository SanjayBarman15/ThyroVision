"use client";

import NotFoundState from "@/components/ui/not-found-state";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <NotFoundState
        title="404"
        subtitle="Scan Path Not Found"
        description="The node you are looking for has been moved, deleted, or never existed in our diagnostic records. Please verify the URL or return to safety."
        icon={Search}
        actionLabel="Return to Dashboard"
        actionHref="/dashboard"
        secondaryActionLabel="View Home"
        secondaryActionHref="/"
      />
    </div>
  );
}

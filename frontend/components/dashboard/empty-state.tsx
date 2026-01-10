"use client";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-card/30 p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 mb-4">
        <Upload className="h-8 w-8 text-secondary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No scans yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        There are no patient records to display. Start by uploading your first
        ultrasound scan for analysis.
      </p>
      <Button
        onClick={onAction}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Start New Scan
      </Button>
    </div>
  );
}

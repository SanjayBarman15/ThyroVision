"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface HeaderProps {
  patientName?: string;
  scanDate?: string;
  predictionId?: string;
}

export default function Header({
  patientName = "Unknown Patient",
  scanDate,
  predictionId,
}: HeaderProps) {
  const [isExporting, setIsExporting] = useState(false);
  const supabase = createClient();

  const handleExport = async () => {
    if (!predictionId) {
      toast.error("No prediction data available to export.");
      return;
    }

    setIsExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const response = await fetch(`${backendUrl}/export/pdf/${predictionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ThyroSight_Report_${patientName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 pointer-cursor">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-sm font-semibold text-foreground">{patientName}</h1>
        {scanDate && (
          <span className="text-xs text-muted-foreground">
            Scan Time: {scanDate}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!predictionId || isExporting}
          onClick={handleExport}
          className="text-muted-foreground hover:text-foreground border-border bg-transparent min-w-[120px]"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>
    </header>
  );
}

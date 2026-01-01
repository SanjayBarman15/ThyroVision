"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, FileText } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  patientName?: string;
  scanDate?: string;
}

export default function Header({
  patientName = "Unknown Patient",
  scanDate,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
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
          className="text-muted-foreground hover:text-foreground border-border bg-transparent"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </header>
  );
}

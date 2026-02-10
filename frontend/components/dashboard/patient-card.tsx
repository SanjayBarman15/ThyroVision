"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  getTiradsClass,
  getPatientStatusBarClass,
} from "@/lib/colors";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastScan: string;
  tirads: string;
  status: "new" | "reviewed" | "high-risk" | "feedback-pending";
}

export default function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Card className="relative flex items-stretch border-border/60 bg-card/60 hover:bg-card transition-all rounded-xl overflow-hidden">
      
      {/* Status Bar */}
      <div className={`w-1 ${getPatientStatusBarClass(patient.status)}`} />

      {/* Content */}
      <div className="flex flex-1 items-center justify-between px-6  gap-6">
        
        {/* Left: Patient Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {patient.name}
            </h3>

            {patient.status !== "reviewed" && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 capitalize border-border/50"
              >
                {patient.status.replace("-", " ")}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{patient.age}y</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{patient.gender}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>
              {new Date(patient.lastScan).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Middle: Clinical Info */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            TI-RADS
          </span>
          <Badge
            variant="outline"
            className={`${getTiradsClass(
              patient.tirads
            )} font-mono text-sm font-bold px-3 py-1`}
          >
            {patient.tirads}
          </Badge>
        </div>

        {/* Right: Action (ALWAYS VISIBLE) */}
        <Link href={`/analysis/${patient.id}`}>
          <Button
            size="sm"
            className="h-7 px-5 cursor-pointer  bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 rounded-lg"
          >
            View
          </Button>
        </Link>
      </div>
    </Card>
  );
}

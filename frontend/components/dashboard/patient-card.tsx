"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Eye,
  FileText,
  MessageSquareMore,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import Link from "next/link";

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
  const getTiRADSColor = (level: string) => {
    switch (level) {
      case "1":
      case "2":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "3":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
      case "4":
        return "bg-orange-500/15 text-orange-400 border-orange-500/20";
      case "5":
        return "bg-red-500/15 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-400 border-blue-500/20";
      case "high-risk":
        return "bg-orange-500/20 text-orange-400 border-orange-500/20";
      case "feedback-pending":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="group relative">
      <Card className="border-border bg-card/50 hover:bg-card transition-all p-0 flex items-stretch overflow-hidden group-hover:border-secondary/30 relative">
        {/* Status Indicator Bar - Full Height */}
        <div
          className={`w-1 shrink-0 ${
            patient.status === "high-risk"
              ? "bg-orange-500"
              : patient.status === "new"
              ? "bg-blue-500"
              : "bg-transparent"
          }`}
        />

        <div className="flex-1 flex items-center justify-between p-4 pr-48">
          {/* Patient Info */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">
                  {patient.name}
                </h3>
                {patient.status !== "reviewed" && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-5 px-1.5 capitalize border ${getStatusColor(
                      patient.status
                    )}`}
                  >
                    {patient.status.replace("-", " ")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {patient.age}y / {patient.gender}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1">
                  {new Date(patient.lastScan).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Data - Improved Alignment */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              TI-RADS
            </span>
            <Badge
              variant="outline"
              className={`${getTiRADSColor(
                patient.tirads
              )} font-mono text-sm font-bold px-3 py-1`}
            >
              {patient.tirads}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Hover Actions - Absolute Positioned on Right with background to prevent text bleed */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0 z-10 pl-6 bg-linear-to-l from-card via-card to-transparent py-2">
        <Link href={`/analysis/${patient.id}`}>
          <Button
            size="sm"
            variant="default"
            className="h-8 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            View
          </Button>
        </Link>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shadow-lg bg-card border border-border hover:bg-secondary hover:text-secondary-foreground"
        >
          <FileText className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shadow-lg bg-card border border-border hover:bg-secondary hover:text-secondary-foreground"
        >
          <MessageSquareMore className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

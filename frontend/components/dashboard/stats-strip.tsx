"use client";

import { Card } from "@/components/ui/card";
import { Users, AlertTriangle, FileInput, MessageSquare } from "lucide-react";
import { statsCardClasses } from "@/lib/colors";

interface StatsStripProps {
  totalPatients: number;
  newScansCount: number;
}

export default function StatsStrip({
  totalPatients,
  newScansCount,
}: StatsStripProps) {
  const stats = [
    {
      label: "Total Patients",
      value: totalPatients.toLocaleString(),
      icon: Users,
      trend: "+12%", // Mock trend for now
      color: statsCardClasses.totalPatients.text,
      bg: statsCardClasses.totalPatients.bg,
    },
    {
      label: "High Risk (TR4-5)",
      value: "14",
      icon: AlertTriangle,
      trend: "+2",
      color: statsCardClasses.highRisk.text,
      bg: statsCardClasses.highRisk.bg,
    },
    {
      label: "New Scans (24h)",
      value: newScansCount.toString(),
      icon: FileInput,
      trend: "New",
      color: statsCardClasses.newScans.text,
      bg: statsCardClasses.newScans.bg,
    },
    {
      label: "Pending Feedback",
      value: "5",
      icon: MessageSquare,
      trend: "-2",
      color: statsCardClasses.pendingFeedback.text,
      bg: statsCardClasses.pendingFeedback.bg,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="p-4 border-border bg-card/40 hover:bg-card/60 transition-colors flex flex-col justify-between h-28 relative overflow-hidden group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div
              className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}
            >
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/70 bg-secondary/10 px-1.5 py-0.5 rounded-full">
              {stat.trend}
            </span>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-bold text-foreground block tracking-tight">
              {stat.value}
            </span>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {stat.label}
            </p>
          </div>
          {/* Subtle background decoration */}
          <stat.icon
            className={`absolute -right-4 -bottom-4 h-24 w-24 ${stat.color} opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-500`}
          />
        </Card>
      ))}
    </div>
  );
}

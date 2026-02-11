"use client";

import { Card } from "@/components/ui/card";
import { Users, FileInput } from "lucide-react";
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
      color: statsCardClasses.totalPatients.text,
      bg: statsCardClasses.totalPatients.bg,
      badge: "All time",
    },
    {
      label: "New Scans",
      value: newScansCount.toString(),
      icon: FileInput,
      color: statsCardClasses.newScans.text,
      bg: statsCardClasses.newScans.bg,
      badge: "Last 24h",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="
            relative h-32 p-4 overflow-hidden
            bg-card/40 backdrop-blur
            border border-border/60
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-lg hover:bg-card/70
            group
          "
        >
          {/* Glow background */}
          <div
            className={`
              absolute inset-0 opacity-0 group-hover:opacity-100
              transition-opacity duration-300
              ${stat.bg}
              blur-2xl
            `}
          />

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div
                className={`
                  p-2 rounded-xl
                  ${stat.bg}
                  shadow-sm
                  transition-transform duration-300
                  group-hover:scale-110
                `}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium">
                {stat.badge}
              </span>
            </div>

            {/* Value */}
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-foreground leading-none">
                {stat.value}
              </span>
              <p className="mt-1 text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

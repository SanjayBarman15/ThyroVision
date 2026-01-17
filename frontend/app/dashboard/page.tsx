"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, ArrowUpDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewScanPanel from "@/components/new-scan-panel";
import StatsStrip from "@/components/dashboard/stats-strip";
import PatientCard from "@/components/dashboard/patient-card";
import EmptyState from "@/components/dashboard/empty-state";
import { signout } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type PatientStatus = "new" | "reviewed" | "high-risk" | "feedback-pending";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastScan: string;
  tirads: string;
  status: PatientStatus;
}

export default function DashboardPage() {
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");
  const [stats, setStats] = useState({
    totalPatients: 0,
    newScansCount: 0,
  });

  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch doctor details
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("name")
        .eq("id", user.id)
        .single();

      if (doctorData) {
        setDoctorName(doctorData.name);
      }

      // Fetch patients for this doctor
      // 1. Get Doctor ID (which is user.id)
      // 2. Query patients
      const { data: patientsData, error } = await supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        return;
      }

      if (patientsData) {
        // Map DB data to UI format
        const formattedPatients: Patient[] = patientsData.map((p) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          age: p.age || 0, // Fallback if age not calculated
          gender: p.gender,
          lastScan: new Date(p.created_at).toISOString().split("T")[0],
          tirads: "N/A", // Placeholder until analysis is linked
          status: "new", // Default status
        }));

        setPatients(formattedPatients);

        // Calculate Stats
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const newScans = patientsData.filter(
          (p) => new Date(p.created_at) > oneDayAgo,
        ).length;

        setStats({
          totalPatients: patientsData.length,
          newScansCount: newScans,
        });
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const [sortBy, setSortBy] = useState<"urgency" | "recent" | "name">(
    "urgency",
  );

  // Sorting Logic
  const sortedPatients = [...patients].sort((a, b) => {
    if (sortBy === "urgency") {
      // Priority: High Risk -> New -> Feedback Pending -> Reviewed
      const priority = {
        "high-risk": 0,
        new: 1,
        "feedback-pending": 2,
        reviewed: 3,
      };
      return priority[a.status] - priority[b.status];
    }
    if (sortBy === "recent") {
      return new Date(b.lastScan).getTime() - new Date(a.lastScan).getTime();
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">TV</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">
                ThyroSight
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Radiology Suite
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-foreground">
                {doctorName || "Doctor"}
              </p>
              <p className="text-xs text-muted-foreground">
                Senior Radiologist
              </p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <form action={signout}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                type="submit"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Actions Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Dashboard Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Welcome back, {doctorName || "Doctor"}. You have{" "}
              <span className="text-primary font-medium">
                {stats.newScansCount} new analyses
              </span>{" "}
              today.
            </p>
          </div>
          <Button
            onClick={() => setIsNewScanOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Start New Scan
          </Button>
        </div>

        {/* Stats Strip */}
        <StatsStrip
          totalPatients={stats.totalPatients}
          newScansCount={stats.newScansCount}
        />

        {/* Patient List Section */}
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
          {/* List Controls / Smart Sorting */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Recent Scans</h3>
              <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full">
                {patients.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-3 w-3 mr-1.5" /> Filter
              </Button>
              <div className="h-4 w-px bg-border" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1.5" /> Sort:{" "}
                    <span className="text-foreground ml-1 font-medium capitalize">
                      {sortBy}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("urgency")}>
                    Urgency (High Risk first)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Patient Name
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : sortedPatients.length > 0 ? (
            <div className="space-y-3">
              {sortedPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <EmptyState onAction={() => setIsNewScanOpen(true)} />
          )}
        </div>
      </main>

      {/* New Scan Panel */}
      <NewScanPanel
        isOpen={isNewScanOpen}
        onClose={() => setIsNewScanOpen(false)}
        onScanComplete={fetchDashboardData}
      />
    </div>
  );
}

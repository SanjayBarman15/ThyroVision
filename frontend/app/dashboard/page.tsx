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
      // 2. Query patients with latest predictions
      const { data: patientsData, error } = await supabase
        .from("patients")
        .select(
          `
          *,
          raw_images (
            id,
            uploaded_at,
            predictions (
              tirads
            )
          )
        `,
        )
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        return;
      }

      if (patientsData) {
        // Map DB data to UI format
        const formattedPatients: Patient[] = patientsData.map((p: any) => {
          // Find the latest raw image that has a prediction
          const latestRawImage = p.raw_images
            ?.sort(
              (a: any, b: any) =>
                new Date(b.uploaded_at).getTime() -
                new Date(a.uploaded_at).getTime(),
            )
            .find((img: any) => img.predictions && img.predictions.length > 0);

          const tiradsScore = latestRawImage?.predictions?.[0]?.tirads;

          return {
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            age: p.age || 0, // Fallback if age not calculated
            gender: p.gender,
            lastScan: new Date(p.created_at).toISOString().split("T")[0],
            tirads: tiradsScore ? `TR${tiradsScore}` : "N/A",
            status: tiradsScore ? "reviewed" : "new",
          };
        });

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
    <div className="min-h-screen bg-black relative">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-black rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black rounded-full blur-3xl" />
        {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-size-[40px_40px]" /> */}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
              <span className="text-primary font-bold text-lg">TS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-none tracking-tight">
                ThyroSight
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                Radiology Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-semibold text-foreground">
                {doctorName || "Doctor"}
              </p>
              <p className="text-xs text-muted-foreground">
                Senior Radiologist
              </p>
            </div>
            <div className="h-8 w-px bg-border/50 hidden sm:block" />
            <form action={signout}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white bg-red-500 hover:text-white rounded-lg transition-all"
                type="submit"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Actions Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Dashboard Overview
            </h2>
            <p className="text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{doctorName || "Doctor"}</span>. 
              {stats.newScansCount > 0 && (
                <> You have{" "}
                  <span className="text-primary font-semibold">
                    {stats.newScansCount} new {stats.newScansCount === 1 ? "analysis" : "analyses"}
                  </span>{" "}
                  today.</>
              )}
              {stats.newScansCount === 0 && " No new analyses today."}
            </p>
          </div>
          <Button
            onClick={() => setIsNewScanOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95 px-6 h-11 rounded-xl font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Start New Scan
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="mb-8">
          <StatsStrip
            totalPatients={stats.totalPatients}
            newScansCount={stats.newScansCount}
          />
        </div>

        {/* Patient List Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg p-6">
          {/* List Controls / Smart Sorting */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground">Recent Scans</h3>
              <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full border border-primary/20">
                {patients.length} {patients.length === 1 ? "patient" : "patients"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter
              </Button>
              <div className="h-5 w-px bg-border/50" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-muted-foreground  hover:text-white rounded-lg transition-all"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /> Sort:{" "}
                    <span className="text-foreground ml-1 font-semibold capitalize">
                      {sortBy}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                  <DropdownMenuItem 
                    onClick={() => setSortBy("urgency")}
                    className="rounded-lg cursor-pointer"
                  >
                    Urgency (High Risk first)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("recent")}
                    className="rounded-lg cursor-pointer"
                  >
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("name")}
                    className="rounded-lg cursor-pointer"
                  >
                    Patient Name
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
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

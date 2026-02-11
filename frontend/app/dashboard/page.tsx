"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Clock3, ArrowDownAZ } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

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
  const supabase = createClient();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);

  // Profile modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [age, setAge] = useState("");
  const [department, setDepartment] = useState("");
  const [hospital, setHospital] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [stats, setStats] = useState({
    totalPatients: 0,
    newScansCount: 0,
  });

  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch doctor info
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("name")
        .eq("id", user.id)
        .single();

      if (doctorData) setDoctorName(doctorData.name);

      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select(`
          *,
          raw_images (
            id,
            uploaded_at,
            predictions (
              tirads,
              id
            )
          )
        `)
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (patientsError) {
        console.error("Error fetching patients:", patientsError);
      }

      if (patientsData) {
        const formatted: Patient[] = patientsData.map((p: any) => {
          // Ensure raw_images is an array
          const rawImages = Array.isArray(p.raw_images) ? p.raw_images : [];
          
          // Get all raw images with predictions, sorted by upload date (newest first)
          const rawImagesWithPredictions = rawImages
            .filter((img: any) => {
              // Check if predictions exist and is an array with at least one item
              return Array.isArray(img.predictions) && 
                     img.predictions.length > 0 && 
                     img.predictions[0]?.tirads !== undefined &&
                     img.predictions[0]?.tirads !== null;
            })
            .sort(
              (a: any, b: any) =>
                new Date(b.uploaded_at || 0).getTime() -
                new Date(a.uploaded_at || 0).getTime(),
            );

          // Get the latest raw image with a prediction
          const latestRawImage = rawImagesWithPredictions[0];
          const tiradsScore = latestRawImage?.predictions?.[0]?.tirads;

          // Use the latest scan date from raw_images, or fallback to patient creation date
          const latestScanDate = latestRawImage?.uploaded_at 
            ? new Date(latestRawImage.uploaded_at).toISOString().split("T")[0]
            : new Date(p.created_at).toISOString().split("T")[0];

          return {
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            age: p.age || 0,
            gender: p.gender,
            lastScan: latestScanDate,
            tirads: tiradsScore !== undefined && tiradsScore !== null ? `TR${tiradsScore}` : "N/A",
            status: (tiradsScore !== undefined && tiradsScore !== null ? "reviewed" : "new") as PatientStatus,
          };
        });

        setPatients(formatted);

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        setStats({
          totalPatients: patientsData.length,
          newScansCount: patientsData.filter(
            (p) => new Date(p.created_at) > oneDayAgo,
          ).length,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch profile when modal opens
  useEffect(() => {
    if (!isProfileOpen) return;

    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("doctors")
        .select("age, department, hospital")
        .eq("id", user.id)
        .single();

      if (data) {
        setAge(data.age?.toString() || "");
        setDepartment(data.department || "");
        setHospital(data.hospital || "");
      }
    };

    fetchProfile();
  }, [isProfileOpen, supabase]);

  const saveProfile = async () => {
    setSavingProfile(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("doctors")
      .update({
        age: age ? Number(age) : null,
        department,
        hospital,
      })
      .eq("id", user.id);

    setSavingProfile(false);
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">ThyroSight</h1>

          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {doctorName || "Doctor"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  Edit Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form action={signout}>
              <Button size="sm" className="bg-red-500 text-white" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

<div className="flex justify-end">
  <Button
    onClick={() => setIsNewScanOpen(true)}
    className="bg-green-800 text-white"
  >
    <Plus className="h-4 w-4 mr-2" />
    Start New Scan
  </Button>
</div>


        <div className="mt-6">
          {/* Filter/Sort Controls */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Scans</h2>
            <div className="flex items-center gap-2  border border-green-900 px-2 py-1 rounded">
              <span className="hidden sm:inline text-[11px] font-medium  uppercase tracking-wide">
                Sort by
              </span>
              {(["recent", "name"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-green-900 transition-all border
                    ${
                      sortBy === key
                        ? "bg-primary text-primary-foreground border-primary "
                        : "bg-transparent text-muted-foreground border-transparent hover:bg-background/40 hover:text-foreground"
                    }`}
                >
                  {key === "recent" && (
                    <>
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Most recent</span>
                    </>
                  )}
                  {key === "name" && (
                    <>
                      <ArrowDownAZ className="h-3.5 w-3.5" />
                      <span>Name A–Z</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (() => {
              const sortedPatients = [...patients].sort((a, b) => {
                if (sortBy === "recent") {
                  return new Date(b.lastScan).getTime() - new Date(a.lastScan).getTime();
                }
                if (sortBy === "name") {
                  return a.name.localeCompare(b.name);
                }
                return 0;
              });

              return sortedPatients.length > 0 ? (
                sortedPatients.map((p) => <PatientCard key={p.id} patient={p} />)
              ) : (
                <EmptyState onAction={() => setIsNewScanOpen(true)} />
              );
            })()}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <Input
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <Input
                placeholder="Hospital"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NewScanPanel
        isOpen={isNewScanOpen}
        onClose={() => setIsNewScanOpen(false)}
        onScanComplete={fetchDashboardData}
      />
    </div>
  );
}

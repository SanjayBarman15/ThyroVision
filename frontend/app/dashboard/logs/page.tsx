// frontend/app/dashboard/logs/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { SystemLog, LogFilters } from "@/types/logs";
import { LogsFilters } from "@/components/logs/LogsFilters";
import { LogsTable } from "@/components/logs/LogsTable";
import { LogDetailsDrawer } from "@/components/logs/LogDetailsDrawer";
import { Button } from "@/components/ui/button";
import {
  Download,
  RefreshCw,
  Activity,
  ShieldCheck,
  Database,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { isWithinInterval } from "date-fns";
import { statsCardClasses } from "@/lib/colors";

const ITEMS_PER_PAGE = 10;

export default function SystemLogsPage() {
  const [allLogs, setAllLogs] = useState<SystemLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState<boolean | null>(
    null,
  );
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>({
    level: "ALL",
    action: "ALL",
    search: "",
  });

  // Check config and load logs
  useEffect(() => {
    async function init() {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const configRes = await fetch(`${backendUrl}/api/logs/config`);
        const configData = await configRes.json();
        setIsLoggingEnabled(configData.logging_enabled);
        setIsConfigLoading(false);

        if (configData.logging_enabled) {
          await fetchLogs(1, filters);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch logs config:", error);
        toast.error("Failed to connect to backend");
        setIsConfigLoading(false);
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const fetchLogs = async (page: number, currentFilters: LogFilters) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      });

      if (currentFilters.level !== "ALL")
        queryParams.append("level", currentFilters.level);
      if (currentFilters.action !== "ALL")
        queryParams.append("action", currentFilters.action);
      // Backend search is not yet implemented for all fields, we'll keep frontend filtering for now if needed or implement backend search later

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(
        `${backendUrl}/api/logs?${queryParams.toString()}`,
      );
      const data = await response.json();

      setAllLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (error) {
      toast.error("Failed to fetch logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggingEnabled) {
      fetchLogs(currentPage, filters);
    }
  }, [currentPage, filters, isLoggingEnabled]);

  const handleRefresh = () => {
    fetchLogs(currentPage, filters);
    toast.success("Logs refreshed from server");
  };

  const clearFilters = () => {
    setFilters({
      level: "ALL",
      action: "ALL",
      search: "",
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    // Current stats are only for the loaded page or simple counts.
    // In a real app we might want a separate stats endpoint.
    return {
      total: totalLogs,
      errors: allLogs.filter((l) => l.level === "ERROR" || l.level === "FATAL")
        .length,
      inference: allLogs.filter((l) => l.action === "MODEL_INFERENCE").length,
    };
  }, [allLogs, totalLogs]);

  if (isConfigLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">
            Checking system status...
          </p>
        </div>
      </div>
    );
  }

  if (isLoggingEnabled === false) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl animate-in fade-in duration-500">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              System Logs
            </h1>
            <ShieldAlert className="h-5 w-5 text-destructive mt-1" />
          </div>
          <p className="text-muted-foreground text-sm max-w-md italic">
            Logging is currently disabled for this environment.
          </p>
        </header>

        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-6 px-4">
            System activity logging has been disabled by the administrator via{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              SYSTEM_LOGGING_ENABLED
            </code>
            .
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-border"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check again
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalLogs / ITEMS_PER_PAGE));

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              System Logs
            </h1>
            <ShieldCheck className="h-5 w-5 text-primary mt-1" />
          </div>
          <p className="text-muted-foreground text-sm max-w-md italic">
            Audit trail and system activity monitoring for medical compliance
            and technical debugging.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 bg-card border-border hover:bg-muted"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-95"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            icon: Activity,
            label: "Total Events",
            value: stats.total,
            color: statsCardClasses.totalPatients.text,
            bg: statsCardClasses.totalPatients.bg,
          },
          {
            icon: AlertTriangle,
            label: "System Alerts",
            value: stats.errors,
            color: statsCardClasses.systemAlerts.text,
            bg: statsCardClasses.systemAlerts.bg,
          },
          {
            icon: Database,
            label: "Model Inferences",
            value: stats.inference,
            color: statsCardClasses.modelInferences.text,
            bg: statsCardClasses.modelInferences.bg,
          },
        ].map(
          (stat, i) =>
            stat.icon && (
              <div
                key={i}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card shadow-sm ring-1 ring-white/5"
              >
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {stat.value}
                  </p>
                </div>
              </div>
            ),
        )}
      </div>

      <LogsFilters
        filters={filters}
        onFilterChange={(f) => {
          setFilters(f);
          setCurrentPage(1);
        }}
        onClearFilters={clearFilters}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl bg-muted" />
          <Skeleton className="h-64 w-full rounded-xl bg-muted/50" />
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          <LogsTable
            logs={allLogs}
            onRowClick={setSelectedLog}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <LogDetailsDrawer
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

// Add AlertTriangle to import from lucide-react if missed
import { AlertTriangle, ShieldAlert, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

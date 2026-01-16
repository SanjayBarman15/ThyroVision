// frontend/app/dashboard/logs/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { SystemLog, LogFilters } from "@/types/logs";
import { generateMockLogs } from "@/utils/mock-logs";
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

const ITEMS_PER_PAGE = 10;

export default function SystemLogsPage() {
  const [allLogs, setAllLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>({
    level: "ALL",
    action: "ALL",
    search: "",
  });

  // Load logs initially
  useEffect(() => {
    const timer = setTimeout(() => {
      setAllLogs(generateMockLogs(100));
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setAllLogs(generateMockLogs(100));
      setCurrentPage(1);
      setIsLoading(false);
      toast.success("Logs refreshed from server");
    }, 800);
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

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const levelMatch = filters.level === "ALL" || log.level === filters.level;
      const actionMatch =
        filters.action === "ALL" || log.action === filters.action;
      const searchMatch =
        !filters.search ||
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.request_id.toLowerCase().includes(filters.search.toLowerCase()) ||
        (log.resource_id &&
          log.resource_id.toLowerCase().includes(filters.search.toLowerCase()));

      let dateMatch = true;
      if (filters.startDate && filters.endDate) {
        dateMatch = isWithinInterval(new Date(log.created_at), {
          start: filters.startDate,
          end: filters.endDate,
        });
      } else if (filters.startDate) {
        dateMatch = new Date(log.created_at) >= filters.startDate;
      }

      return levelMatch && actionMatch && searchMatch && dateMatch;
    });
  }, [allLogs, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  );
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const stats = useMemo(() => {
    return {
      total: allLogs.length,
      errors: allLogs.filter((l) => l.level === "ERROR" || l.level === "FATAL")
        .length,
      inference: allLogs.filter((l) => l.action === "MODEL_INFERENCE").length,
    };
  }, [allLogs]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              System Logs
            </h1>
            <ShieldCheck className="h-5 w-5 text-blue-500 mt-1" />
          </div>
          <p className="text-slate-500 text-sm max-w-md italic">
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
            className="h-9 bg-white border-slate-200"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-9 bg-slate-900 hover:bg-slate-800 shadow-sm transition-all active:scale-95"
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
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: AlertTriangle,
            label: "System Alerts",
            value: stats.errors,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            icon: Database,
            label: "Model Inferences",
            value: stats.inference,
            color: "text-slate-600",
            bg: "bg-slate-50",
          },
        ].map(
          (stat, i) =>
            stat.icon && (
              <div
                key={i}
                className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100/50"
              >
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {stat.value}
                  </p>
                </div>
              </div>
            )
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
          <Skeleton className="h-12 w-full rounded-xl bg-slate-200" />
          <Skeleton className="h-64 w-full rounded-xl bg-slate-100/50" />
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          <LogsTable
            logs={paginatedLogs}
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
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

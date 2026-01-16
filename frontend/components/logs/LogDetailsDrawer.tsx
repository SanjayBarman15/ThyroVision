// frontend/components/logs/LogDetailsDrawer.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SystemLog } from "@/types/logs";
import { LogLevelBadge, ActionBadge } from "./LogBadges";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  User,
  HardDrive,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogDetailsDrawerProps {
  log: SystemLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogDetailsDrawer({
  log,
  isOpen,
  onClose,
}: LogDetailsDrawerProps) {
  if (!log) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formattedDate = format(new Date(log.created_at), "PPPP");
  const formattedTime = format(new Date(log.created_at), "HH:mm:ss.SSS (xxx)");

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 border-l border-slate-200">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <LogLevelBadge level={log.level} className="text-xs px-3" />
                <div className="flex items-center gap-2">
                  {log.status === "success" ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Success
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
                      <XCircle className="h-3.5 w-3.5" />
                      Failure
                    </div>
                  )}
                </div>
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold text-slate-900 leading-tight">
                  {log.message}
                </SheetTitle>
                <SheetDescription className="mt-2 flex items-center gap-2">
                  <ActionBadge action={log.action} />
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono tracking-tighter">
                    {log.id}
                  </span>
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="space-y-6">
              {/* Timing Section */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Timing
                </h3>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-sm font-medium text-slate-700">
                    {formattedDate}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {formattedTime}
                  </p>
                </div>
              </section>

              {/* Actor & Resource Section */}
              <section className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Actor
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold capitalize text-slate-700">
                      {log.actor_role || "Unknown Role"}
                    </p>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      {log.actor_id || "N/A"}
                      {log.actor_id && (
                        <button
                          onClick={() =>
                            copyToClipboard(log.actor_id!, "Actor ID")
                          }
                          className="text-slate-300 hover:text-slate-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" /> Resource
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold capitalize text-slate-700">
                      {log.resource_type || "No Resource"}
                    </p>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      {log.resource_id || "N/A"}
                      {log.resource_id && (
                        <button
                          onClick={() =>
                            copyToClipboard(log.resource_id!, "Resource ID")
                          }
                          className="text-slate-300 hover:text-slate-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* Request Context */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5" /> Request Context
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                  <code className="text-xs font-mono text-slate-600">
                    {log.request_id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400"
                    onClick={() =>
                      copyToClipboard(log.request_id, "Request ID")
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </section>

              {/* Error Details if any */}
              {(log.error_code || log.error_message) && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" /> Error details
                  </h3>
                  <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                    <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-red-700">
                      <span>[{log.error_code || "UNKNOWN_ERROR"}]</span>
                    </div>
                    <p className="text-sm text-red-800 leading-relaxed">
                      {log.error_message || "No error message provided."}
                    </p>
                  </div>
                </section>
              )}

              <Separator className="bg-slate-100" />

              {/* Metadata JSON */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Metadata
                </h3>
                <div className="rounded-lg bg-slate-900 p-4 overflow-hidden">
                  <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

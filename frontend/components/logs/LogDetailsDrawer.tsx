"use client";

import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { SystemLog } from "@/types/logs";
import { ActionBadge } from "./LogBadges";
import { format } from "date-fns";
import {
  Copy,
  Clock,
  User,
  HardDrive,
  Hash,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const isError =
    log.error_code &&
    ![
      "OK",
      "PATIENT_CREATED",
      "UPLOAD_OK",
      "INFERENCE_OK",
      "EXPLANATION_OK",
      "FEEDBACK_OK",
      "EXPORT_PDF_OK",
    ].includes(log.error_code);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:w-[560px] p-0 bg-slate-50 border-l border-black/10">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">

            {/* Header */}
            <header className="space-y-3">
              <div className="flex items-center gap-2">
                {isError ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {log.level}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 leading-snug">
                {log.message}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ActionBadge action={log.action} />
                <span>•</span>
                <code className="font-mono text-indigo-600">
                  {log.id}
                </code>
              </div>
            </header>

            {/* Timing */}
            <section className="rounded-xl bg-white p-4 flex items-center gap-3 shadow-sm border border-black/10">
              <Clock className="h-4 w-4 text-indigo-800" />
              <div>
                <p className="text-sm font-medium text-black">
                  {format(new Date(log.created_at), "PPPP")}
                </p>
                <p className="text-xs font-mono text-slate-800">
                  {format(new Date(log.created_at), "HH:mm:ss.SSS")}
                </p>
              </div>
            </section>

            {/* Actor & Resource */}
            <section className="grid grid-cols-2 gap-6">
              <InfoBlock
                icon={<User className="text-indigo-500" />}
                title="Actor"
                value={log.actor_role}
                id={log.actor_id}
                onCopy={() => copy(log.actor_id!, "Actor ID")}
              />
              <InfoBlock
                icon={<HardDrive className="text-indigo-500" />}
                title="Resource"
                value={log.resource_type}
                id={log.resource_id}
                onCopy={() => copy(log.resource_id!, "Resource ID")}
              />
            </section>

            {/* Request ID */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-800">
                <Hash className="h-3.5 w-3.5 text-indigo-500" />
                Request ID
              </div>
              <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 border border-black/10">
                <code className="text-xs font-mono text-indigo-700">
                  {log.request_id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copy(log.request_id, "Request ID")}
                >
                  <Copy className="h-4 w-4 text-indigo-500" />
                </Button>
              </div>
            </section>

            {/* Error */}
            {isError && (
              <section className="rounded-xl bg-red-50 p-4 space-y-2 border border-red-200">
                <p className="text-sm font-semibold text-red-600">
                  {log.error_code}
                </p>
                <p className="text-sm text-red-700 leading-relaxed">
                  {log.error_message}
                </p>
              </section>
            )}

            {/* Metadata */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-800">
                  Metadata
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copy(JSON.stringify(log.metadata, null, 2), "Metadata JSON")
                  }
                  className="text-slate-800 hover:text-indigo-600"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="rounded-xl bg-slate-900 p-4">
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </section>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------------------------- */
/* Reusable Info Block                 */
/* ---------------------------------- */

function InfoBlock({
  icon,
  title,
  value,
  id,
  onCopy,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string | null;
  id?: string | null;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-xl bg-slate-200 p-4 shadow-sm space-y-1 border border-black/10">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-800">
        {icon}
        {title}
      </div>
      <p className="text-sm font-medium text-black capitalize">
        {value || "N/A"}
      </p>
      {id && (
        <div className="flex items-center gap-1 text-xs font-mono text-slate-800">
          {id}
          <button onClick={onCopy}>
            <Copy className="h-3 w-3 " />
          </button>
        </div>
      )}
    </div>
  );
}

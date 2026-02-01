// frontend/components/logs/LogsTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SystemLog } from "@/types/logs";
import { LogLevelBadge, ActionBadge } from "./LogBadges";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogsTableProps {
  logs: SystemLog[];
  onRowClick: (log: SystemLog) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getLogMessage = (log: SystemLog): string => {
  if (log.message) return log.message;

  switch (log.action) {
    case "MODEL_INFERENCE":
      return `AI prediction generated (TI-RADS: ${log.metadata?.tirads || "N/A"})`;
    case "UPLOAD_RAW_IMAGE":
      return "Scan image uploaded successfully";
    case "UPLOAD_IMAGE_ERROR":
      return `Failed to upload scan image: ${log.error_message || "Unknown error"}`;
    case "CREATE_PATIENT":
      return `New patient profile created: ${log.metadata?.first_name} ${log.metadata?.last_name}`;
    case "SUBMIT_FEEDBACK":
      return `Doctor provided feedback (Correct: ${log.metadata?.is_correct ? "Yes" : "No"})`;
    case "SUBMIT_FEEDBACK_ERROR":
      return `Failed to save feedback: ${log.error_message || "Unknown error"}`;
    case "VALIDATION_ERROR":
      return "Input validation failed for request";
    case "SERVER_ERROR":
      return log.error_message || "Internal server error occurred";
    default:
      return log.action.replace(/_/g, " ").toLowerCase();
  }
};

export function LogsTable({
  logs,
  onRowClick,
  currentPage,
  totalPages,
  onPageChange,
}: LogsTableProps) {
  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[180px] text-xs font-bold uppercase text-muted-foreground py-4">
                Timestamp
              </TableHead>
              <TableHead className="w-[100px] text-xs font-bold uppercase text-muted-foreground py-4">
                Level
              </TableHead>
              <TableHead className="w-[140px] text-xs font-bold uppercase text-muted-foreground py-4">
                Action
              </TableHead>
              <TableHead className="w-[120px] text-xs font-bold uppercase text-muted-foreground py-4">
                Actor
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-muted-foreground py-4">
                Message
              </TableHead>
              <TableHead className="w-[80px] text-center text-xs font-bold uppercase text-muted-foreground py-4">
                Status
              </TableHead>
              <TableHead className="w-[100px] text-center text-xs font-bold uppercase text-muted-foreground py-4">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors group border-border"
                  onClick={() => onRowClick(log)}
                >
                  <TableCell className="py-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                            <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                              {format(new Date(log.created_at), "MMM d")}
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border">
                          <p className="text-xs">{log.created_at}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <LogLevelBadge level={log.level} />
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-foreground capitalize leading-none">
                        {log.actor_role}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[80px]">
                        {log.actor_id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[400px] flex flex-col gap-0.5">
                      <p className="text-sm text-foreground font-medium truncate group-hover:text-primary transition-colors">
                        {log.message || getLogMessage(log)}
                      </p>
                      {log.resource_id && (
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            {log.resource_type}:
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                            {log.resource_id}
                          </span>
                          <button
                            onClick={(e) =>
                              copyToClipboard(log.resource_id!, e)
                            }
                            className="p-0.5 hover:text-primary text-muted-foreground"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {log.error_code &&
                      ![
                        "OK",
                        "PATIENT_CREATED",
                        "UPLOAD_OK",
                        "INFERENCE_OK",
                        "EXPLANATION_OK",
                        "FEEDBACK_OK",
                      ].includes(log.error_code) ? (
                        <>
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-[10px] font-bold text-destructive px-1.5 py-0.5 bg-destructive/10 rounded uppercase tracking-tighter">
                            {log.error_code}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded uppercase tracking-tighter">
                            {log.error_code || "OK"}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-40">
                    <MoreHorizontal className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No logs found matching your criteria
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground">
          Showing page <span className="text-foreground">{currentPage}</span> of{" "}
          <span className="text-foreground">{totalPages}</span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-3 text-xs bg-card border-border hover:bg-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-3 text-xs bg-card border-border hover:bg-muted"
          >
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

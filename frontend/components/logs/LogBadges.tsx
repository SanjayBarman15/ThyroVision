// frontend/components/logs/LogBadges.tsx
import { Badge } from "@/components/ui/badge";
import { LogLevel, LogAction } from "@/types/logs";
import { cn } from "@/lib/utils";

interface LogLevelBadgeProps {
  level: LogLevel;
  className?: string;
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  const variants: Record<LogLevel, string> = {
    INFO: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 shadow-sm transition-colors",
    WARN: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 shadow-sm transition-colors",
    ERROR:
      "bg-red-100 text-red-800 hover:bg-red-100 border-red-200 shadow-sm transition-colors",
    FATAL:
      "bg-rose-900 text-rose-50 hover:bg-rose-900 border-rose-950 shadow-md font-bold transition-all",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-[10px] tracking-wider uppercase font-medium rounded-sm",
        variants[level],
        className,
      )}
    >
      {level}
    </Badge>
  );
}

interface ActionBadgeProps {
  action: LogAction;
  className?: string;
}

export function ActionBadge({ action, className }: ActionBadgeProps) {
  const labels: Record<LogAction, string> = {
    MODEL_INFERENCE: "Model Inference",
    UPLOAD_RAW_IMAGE: "Image Upload",
    UPLOAD_IMAGE_ERROR: "Upload Error",
    CREATE_PATIENT: "Patient Creation",
    SUBMIT_FEEDBACK: "Feedback",
    SUBMIT_FEEDBACK_ERROR: "Feedback Error",
    VALIDATION_ERROR: "Validation",
    SERVER_ERROR: "System Error",
    SYSTEM: "System",
    AUTH_EVENT: "Auth",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 text-[11px] font-normal rounded-full px-2.5",
        className,
      )}
    >
      {labels[action]}
    </Badge>
  );
}

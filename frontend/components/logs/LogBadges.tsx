// frontend/components/logs/LogBadges.tsx
import { Badge } from "@/components/ui/badge";
import { LogLevel, LogAction } from "@/types/logs";
import { cn } from "@/lib/utils";
import { getLogLevelClass, actionBadgeClasses } from "@/lib/colors";

interface LogLevelBadgeProps {
  level: LogLevel;
  className?: string;
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-[10px] tracking-wider uppercase font-medium rounded-sm",
        getLogLevelClass(level),
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
    GENERATE_EXPLANATION: "AI Explanation",
    EXPORT_PDF: "PDF Export",
    EXPORT_PDF_ERROR: "Export Error",
    SYSTEM: "System",
    AUTH_EVENT: "Auth",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        `${actionBadgeClasses.default} text-[11px] font-normal rounded-full px-2.5`,
        className,
      )}
    >
      {labels[action]}
    </Badge>
  );
}

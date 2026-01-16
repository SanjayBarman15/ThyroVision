// frontend/types/logs.ts

export type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export type LogAction =
  | "MODEL_INFERENCE"
  | "IMAGE_UPLOAD"
  | "FEEDBACK_SUBMITTED"
  | "AUTH_EVENT"
  | "SYSTEM";

export type ActorRole = "doctor" | "radiologist" | "system";

export interface SystemLog {
  id: string;
  level: LogLevel;
  action: LogAction;
  actor_id: string | null;
  actor_role: ActorRole | null;
  resource_type: string | null;
  resource_id: string | null;
  request_id: string;
  metadata: Record<string, any> | null;
  error_code: string | null;
  error_message: string | null;
  status: "success" | "failure";
  message: string;
  created_at: string;
}

export interface LogFilters {
  level: LogLevel | "ALL";
  action: LogAction | "ALL";
  search: string;
  startDate?: Date;
  endDate?: Date;
}

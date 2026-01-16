// frontend/utils/mock-logs.ts
import { SystemLog, LogLevel, LogAction, ActorRole } from "@/types/logs";

const LOG_LEVELS: LogLevel[] = ["INFO", "WARN", "ERROR", "FATAL"];
const ACTIONS: LogAction[] = [
  "MODEL_INFERENCE",
  "IMAGE_UPLOAD",
  "FEEDBACK_SUBMITTED",
  "AUTH_EVENT",
  "SYSTEM",
];
const ROLES: ActorRole[] = ["doctor", "radiologist", "system"];

const MESSAGES: Record<LogAction, string[]> = {
  MODEL_INFERENCE: [
    "Processing nodule analysis for patient PX-4521",
    "Inference complete: TI-RADS 3 detected",
    "Model version th-v2.1 initialized",
    "Cloud GPU allocated for batch processing",
  ],
  IMAGE_UPLOAD: [
    "Mammogram DICOM uploaded by Dr. Sarah",
    "Raw ultrasound scan stored securely",
    "Batch upload of 45 images completed",
    "Image compression failed for corrupt file",
  ],
  FEEDBACK_SUBMITTED: [
    "Feedback received for prediction PR-9821",
    "Doctor correction: TI-RADS 5 -> 4",
    "Expert review submitted for training dataset",
  ],
  AUTH_EVENT: [
    "User login: Dr. James (Admin)",
    "Password reset requested for UID-992",
    "Session expired for inactive user",
    "Unusual login activity detected from IP 192.168.1.1",
  ],
  SYSTEM: [
    "Database backup completed successfully",
    "Scheduled cache cleanup triggered",
    "Connection to local hospital PACS restored",
    "System maintenance scheduled for Sunday 02:00 AM",
  ],
};

export function generateMockLogs(count: number = 50): SystemLog[] {
  return Array.from({ length: count })
    .map((_, i) => {
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      const messages = MESSAGES[action];
      const level =
        Math.random() > 0.9
          ? "FATAL"
          : Math.random() > 0.8
          ? "ERROR"
          : Math.random() > 0.7
          ? "WARN"
          : "INFO";

      return {
        id: `log-${1000 + i}`,
        level,
        action,
        actor_id: `user-${Math.floor(Math.random() * 100)}`,
        actor_role: ROLES[Math.floor(Math.random() * ROLES.length)],
        resource_type: action === "IMAGE_UPLOAD" ? "image" : "prediction",
        resource_id: `res-${Math.floor(Math.random() * 10000)}`,
        request_id: `req-${Math.random()
          .toString(36)
          .substring(7)
          .toUpperCase()}`,
        metadata: {
          browser: "Chrome 120",
          ip: "10.0.0.14",
          performance_ms: Math.floor(Math.random() * 2000),
          retry_count: 0,
        },
        error_code:
          level === "ERROR" || level === "FATAL" ? "ERR_500_MOCK" : null,
        error_message:
          level === "ERROR" || level === "FATAL"
            ? "Simulated system failure for debugging purposes."
            : null,
        status: level === "INFO" || level === "WARN" ? "success" : "failure",
        message: messages[Math.floor(Math.random() * messages.length)],
        created_at: new Date(
          Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7)
        ).toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

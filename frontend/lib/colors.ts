/**
 * Centralized color system for ThyroVision
 * All colors used throughout the application should be imported from this file
 */

// TI-RADS Level Colors (Hex values for charts)
export const tiradsColors = {
  tr1: "#5DA686", // Muted Green
  tr2: "#9CAD60", // Muted Lime
  tr3: "#FFD700", // Muted Yellow
  tr4: "#D98A57", // Muted Orange
  tr5: "#C95D5D", // Muted Red
} as const;

// TI-RADS Level Tailwind Classes
export const tiradsClasses = {
  tr1: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  tr2: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  tr3: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  tr4: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  tr5: "bg-red-500/15 text-red-400 border-red-500/20",
  default: "bg-slate-500/15 text-slate-400 border-slate-500/20",
} as const;

// Risk Level Colors
export const riskLevelClasses = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  moderate: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  default: "bg-slate-500/15 text-slate-400 border-slate-500/20",
} as const;

// Patient Status Colors
export const patientStatusClasses = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  reviewed: "bg-secondary text-secondary-foreground border-border",
  "high-risk": "bg-orange-500/20 text-orange-400 border-orange-500/20",
  "feedback-pending": "bg-indigo-500/20 text-indigo-400 border-indigo-500/20",
} as const;

// Patient Status Indicator Bar Colors
export const patientStatusBarClasses = {
  new: "bg-blue-500",
  "high-risk": "bg-orange-500",
  default: "bg-transparent",
} as const;

// Log Level Colors
export const logLevelClasses = {
  INFO: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 shadow-sm transition-colors",
  WARN: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 shadow-sm transition-colors",
  ERROR: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200 shadow-sm transition-colors",
  FATAL: "bg-rose-900 text-rose-50 hover:bg-rose-900 border-rose-950 shadow-md font-bold transition-all",
} as const;

// Error/Alert Colors
export const errorClasses = {
  container: "bg-red-900/20 border border-red-900/30",
  text: "text-red-200",
  detailsContainer: "bg-red-50 border border-red-100",
  detailsHeader: "text-red-700",
  detailsText: "text-red-800",
  header: "text-red-400",
} as const;

// Success Colors
export const successClasses = {
  container: "bg-emerald-50 border border-emerald-100",
  text: "text-emerald-600",
  badge: "bg-emerald-600 text-white",
  badgeHover: "hover:bg-emerald-700",
  icon: "text-emerald-500",
} as const;

// Auth (Login/Signup) - Minimalist UI classes
export const authClasses = {
  page: "min-h-screen bg-background text-foreground",
  shell: "mx-auto w-full max-w-md px-4 py-12",
  header: "mb-8 text-center",
  mark: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary",
  title: "text-2xl font-semibold tracking-tight text-foreground",
  subtitle: "mt-2 text-sm text-muted-foreground",
  card: "rounded-2xl border border-border/60 bg-card shadow-sm",
  cardInner: "p-6 sm:p-8",
  field: "space-y-2",
  label: "text-sm font-medium text-foreground",
  inputWrap: "relative group",
  inputIcon:
    "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground",
  input:
    "h-12 rounded-xl bg-background/40 border-border/60 pl-12 pr-4 text-foreground transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15",
  passwordInput:
    "h-12 rounded-xl bg-background/40 border-border/60 pl-12 pr-12 text-foreground transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15",
  passwordToggle:
    "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15",
  submit:
    "h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed",
  footer: "mt-8 border-t border-border/60 pt-6",
  link: "font-semibold text-primary hover:underline",
  helper: "mt-6 text-center text-xs text-muted-foreground/70",
} as const;

// Stats Card Colors
export const statsCardClasses = {
  totalPatients: {
    text: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  highRisk: {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  newScans: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  pendingFeedback: {
    text: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  systemAlerts: {
    text: "text-destructive",
    bg: "bg-destructive/10",
  },
  modelInferences: {
    text: "text-primary",
    bg: "bg-primary/10",
  },
} as const;

// Upload/File Status Colors
export const uploadStatusClasses = {
  success: "bg-green-500/10 text-green-500",
  default: "bg-primary/10 text-primary",
} as const;

// Image Viewer Colors
export const imageViewerColors = {
  boundingBox: {
    border: "border-emerald-500/80",
    bg: "bg-emerald-500/10",
    shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    labelBg: "bg-emerald-900/90",
    labelText: "text-emerald-400",
    labelBorder: "border-emerald-500/40",
  },
  modeButton: {
    active: "bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]",
    inactive: "text-zinc-500 hover:text-zinc-300",
  },
  gridPattern: "#FFF",
  backgroundGradient: {
    start: "#1e293b",
    end: "#020617",
  },
} as const;

// Action Badge Colors
export const actionBadgeClasses = {
  default: "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200",
} as const;

// Warning/Alert Colors
export const warningClasses = {
  container: "bg-orange-500/5 border border-orange-500/10",
  icon: "text-orange-500",
  text: "text-orange-600/80",
} as const;

// Feedback Form Colors
export const feedbackFormClasses = {
  success: {
    container: "bg-emerald-500/10 border border-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    icon: "text-emerald-500",
    title: "text-emerald-400",
    subtitle: "text-emerald-500/60",
  },
  correct: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
    text: "text-emerald-500",
    hover: "hover:bg-emerald-500/20",
  },
  incorrect: {
    bg: "bg-rose-500/10",
    border: "border-rose-500",
    text: "text-rose-500",
    hover: "hover:bg-rose-500/20",
  },
  incorrectFeature: {
    active: "bg-rose-500/20 border-rose-500/50 text-rose-500",
  },
  error: {
    container: "bg-rose-500/10 border border-rose-500/20",
    text: "text-rose-500",
  },
} as const;

// Helper function to get TI-RADS color class
export function getTiradsClass(level: string): string {
  const numLevel = level.replace("TR", "").trim();
  switch (numLevel) {
    case "1":
    case "2":
      return tiradsClasses.tr1;
    case "3":
      return tiradsClasses.tr3;
    case "4":
      return tiradsClasses.tr4;
    case "5":
      return tiradsClasses.tr5;
    default:
      return tiradsClasses.default;
  }
}

// Helper function to get risk level color class
export function getRiskLevelClass(level: string): string {
  const normalizedLevel = level.toLowerCase();
  return (
    riskLevelClasses[normalizedLevel as keyof typeof riskLevelClasses] ||
    riskLevelClasses.default
  );
}

// Helper function to get patient status color class
export function getPatientStatusClass(
  status: "new" | "reviewed" | "high-risk" | "feedback-pending",
): string {
  return patientStatusClasses[status] || patientStatusClasses.reviewed;
}

// Helper function to get patient status bar color class
export function getPatientStatusBarClass(
  status: "new" | "reviewed" | "high-risk" | "feedback-pending",
): string {
  if (status === "new") return patientStatusBarClasses.new;
  if (status === "high-risk") return patientStatusBarClasses["high-risk"];
  return patientStatusBarClasses.default;
}

// Helper function to get log level color class
export function getLogLevelClass(
  level: "INFO" | "WARN" | "ERROR" | "FATAL",
): string {
  return logLevelClasses[level];
}

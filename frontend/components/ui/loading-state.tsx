"use client";

import { Activity, Zap, Cpu } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  detail?: string;
}

export default function LoadingState({
  message = "Initializing Systems",
  detail = "Preparing diagnostic environment...",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center overflow-hidden">
      {/* Waveform/EKG Animation Container */}
      <div className="relative mb-12 h-24 w-64 flex items-center justify-center">
        {/* The Waveform SVG */}
        <svg
          viewBox="0 0 200 60"
          className="absolute inset-0 h-full w-full stroke-primary/30 fill-none"
        >
          <path
            d="M0 30 L40 30 L50 10 L60 50 L75 30 L110 30 L120 0 L135 60 L150 30 L200 30"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[dash_3s_linear_infinite]"
            style={{
              strokeDasharray: "400",
              strokeDashoffset: "400",
            }}
          />
          {/* Glowing Lead Point */}
          <circle
            r="2"
            className="fill-primary animate-[waveform-point_3s_linear_infinite]"
          >
            <animateMotion
              path="M0 30 L40 30 L50 10 L60 50 L75 30 L110 30 L120 0 L135 60 L150 30 L200 30"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {/* Central Pulse Icon */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-2xl">
          <Activity className="h-8 w-8 text-primary animate-pulse" />

          {/* Orbiting Elements */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <Zap className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 text-secondary" />
          </div>
          <div className="absolute inset-0 animate-[spin_6s_linear_reverse_infinite]">
            <Cpu className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 text-accent" />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">
          {message}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto animate-pulse">
          {detail}
        </p>
      </div>

      {/* Loading Progress Bar */}
      <div className="mt-8 w-48 h-1 bg-border/30 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-primary w-1/3 rounded-full animate-[loading-progress_2s_ease-in-out_infinite]" />
      </div>

      {/* Decorative Grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]">
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,var(--background)_90%]" />
      </div>

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes loading-progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  MoveLeft,
  LucideIcon,
  Search,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotFoundStateProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export default function NotFoundState({
  title = "404",
  subtitle = "Page Not Found",
  description = "The resource you are looking for has been moved, deleted, or never existed.",
  icon: Icon = Search,
  actionLabel = "Return to Dashboard",
  actionHref = "/dashboard",
  secondaryActionLabel = "View Home",
  secondaryActionHref = "/",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      {/* Animated Icon Container */}
      <div className="relative mb-8 h-32 w-32 flex items-center justify-center">
        {/* Pulsing Back Glow */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />

        {/* Scanning Rings */}
        <div className="absolute inset-0 animate-[ping_3s_linear_infinite] rounded-full border border-primary/30" />
        <div className="absolute inset-4 animate-[ping_2s_linear_infinite] rounded-full border border-primary/20" />

        {/* Main Icon */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-border shadow-2xl animate-in zoom-in duration-700">
          <Icon className="h-10 w-10 text-primary animate-bounce" />
        </div>

        {/* Floating Small Icons */}
        <Activity className="absolute -top-2 -right-2 h-6 w-6 text-secondary animate-pulse" />
        <ShieldAlert className="absolute -bottom-2 -left-2 h-6 w-6 text-destructive animate-pulse" />
      </div>

      {/* Text Content */}
      <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
        <h1 className="mb-2 text-7xl font-bold tracking-tighter text-foreground">
          {title}
        </h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground/90">
          {subtitle}
        </h2>
        <p className="mb-8 text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            <Link href={actionHref} className="flex items-center gap-2">
              <MoveLeft className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>

          {secondaryActionLabel && (
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="rounded-full px-8 hover:bg-muted/50 transition-all border border-transparent hover:border-border"
            >
              <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Decorative Grid Component */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]">
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,var(--background)_80%]" />
      </div>
    </div>
  );
}

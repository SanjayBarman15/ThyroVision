"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from "lucide-react";

interface ImageViewerProps {
  zoomLevel: number;
  imageMode: "original" | "processed";
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onModeChange: (mode: "original" | "processed") => void;
}

export default function ImageViewer({
  zoomLevel,
  imageMode,
  onZoomIn,
  onZoomOut,
  onReset,
  onModeChange,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - offsetX, y: e.clientY - offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setOffsetX(e.clientX - dragStart.current.x);
    setOffsetY(e.clientY - dragStart.current.y);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onZoomIn();
    } else {
      onZoomOut();
    }
  };

  const handleDoubleClick = () => {
    onReset();
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <div className="flex flex-col h-full bg-black relative group">
      {/* Main Image Area */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Empty/Loading State Grid Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4" />
            <p className="text-muted-foreground text-xs animate-pulse">
              Loading DICOM data...
            </p>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`,
              transition: isDragging.current
                ? "none"
                : "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {/* Placeholder for actual image */}
            <div
              className={`w-[500px] h-[500px] bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                imageMode === "processed" ? "shadow-primary/10" : ""
              }`}
            >
              {/* Simulated Image Content */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50" />
              <div className="text-center z-10 opacity-40 select-none pointer-events-none">
                <div className="text-6xl mb-4 grayscale filter drop-shadow-lg">
                  {imageMode === "original" ? "📷" : "🔮"}
                </div>
                <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                  {imageMode === "original"
                    ? "Raw Ultrasound"
                    : "AI Segmentation"}
                </p>
              </div>

              {/* AI Overlay Simulation */}
              {imageMode === "processed" && (
                <>
                  <div className="absolute top-1/3 left-1/4 w-32 h-24 border-2 border-emerald-500/70 bg-emerald-500/10 rounded-sm animate-pulse" />
                  <div className="absolute top-1/2 right-1/3 w-20 h-20 border border-blue-500/50 bg-blue-500/10 rounded-full blur-sm" />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlays: Top Left Legend */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-white/10 p-2.5 rounded-md shadow-lg pointer-events-none select-none">
        <p className="text-[10px] uppercase text-muted-foreground mb-1.5 font-bold tracking-wider">
          Overlay Legend
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 rounded-[1px]" />
            <span className="text-xs text-slate-300">Nodule Boundary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-500 rounded-full" />
            <span className="text-xs text-slate-300">Calcification</span>
          </div>
        </div>
      </div>

      {/* Floating Controls - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-2xl">
        {/* Mode Switcher */}
        <div className="flex bg-white/5 rounded-lg p-0.5 mr-2">
          <button
            onClick={() => onModeChange("original")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              imageMode === "original"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Original
          </button>
          <button
            onClick={() => onModeChange("processed")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              imageMode === "processed"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            AI Analysis
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Zoom Tools */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <span className="text-xs font-mono text-zinc-300 w-12 text-center select-none">
          {Math.round(zoomLevel * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
          title="Reset View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

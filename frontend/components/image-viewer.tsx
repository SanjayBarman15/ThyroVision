"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { imageViewerColors } from "@/lib/colors";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  image_width: number;
  image_height: number;
  format?: string;
  coordinate_space?: string;
}

interface ImageViewerProps {
  zoomLevel: number;
  imageMode: "original" | "processed";
  imageUrl?: string;
  boundingBox?: BoundingBox;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onModeChange: (mode: "original" | "processed") => void;
  onZoomScale?: (delta: number) => void;
}

export default function ImageViewer({
  zoomLevel,
  imageMode,
  imageUrl,
  boundingBox,
  onZoomIn,
  onZoomOut,
  onReset,
  onModeChange,
  onZoomScale,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Transform State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });

  // Reset loading when image changes
  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
    }
  }, [imageUrl]);

  // Update position constraints when zoom changes
  useEffect(() => {
    if (zoomLevel <= 1) {
      // Reset position when zoomed out
      setPosition({ x: 0, y: 0 });
      lastPosition.current = { x: 0, y: 0 };
    } else {
      // Clamp current position to new constraints if needed
      // This prevents "losing" the image if you zoom out while panned far away
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const maxX = (width * (zoomLevel - 1)) / 2;
        const maxY = (height * (zoomLevel - 1)) / 2;

        const clampedX = Math.max(-maxX, Math.min(position.x, maxX));
        const clampedY = Math.max(-maxY, Math.min(position.y, maxY));

        if (clampedX !== position.x || clampedY !== position.y) {
          setPosition({ x: clampedX, y: clampedY });
          lastPosition.current = { x: clampedX, y: clampedY };
        }
      }
    }
  }, [zoomLevel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow drag if zoomed in
    if (zoomLevel <= 1) return;

    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPosition.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    // Calculate constraints
    const { width, height } = containerRef.current.getBoundingClientRect();
    const maxOffset_X = (width * (zoomLevel - 1)) / 2;
    const maxOffset_Y = (height * (zoomLevel - 1)) / 2;

    const newX = Math.max(
      -maxOffset_X,
      Math.min(lastPosition.current.x + deltaX, maxOffset_X),
    );
    const newY = Math.max(
      -maxOffset_Y,
      Math.min(lastPosition.current.y + deltaY, maxOffset_Y),
    );

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    lastPosition.current = { ...position };
  };

  // Use a native non-passive listener to prevent browser-level zoom/scroll interference
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // ALWAYS prevent default to stop browser zoom/scroll
      e.preventDefault();

      if (onZoomScale) {
        // Sensitivity of 0.010 as per user's preference
        const sensitivity = 0.009;
        const delta = -e.deltaY * sensitivity;
        onZoomScale(delta);
      } else {
        if (e.deltaY < 0) {
          onZoomIn();
        } else {
          onZoomOut();
        }
      }
    };

    // Prevent Safari/Mac trackpad gestures
    const onGesture = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    });
    container.addEventListener("gesturestart", onGesture, { passive: false });
    container.addEventListener("gesturechange", onGesture, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel, { capture: true } as any);
      container.removeEventListener("gesturestart", onGesture);
      container.removeEventListener("gesturechange", onGesture);
    };
  }, [onZoomScale, onZoomIn, onZoomOut]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-black relative group overflow-hidden select-none touch-none"
      style={{ overscrollBehavior: "none" }}
    >
      {/* Viewport Container */}
      <div
        className={`flex-1 relative w-full h-full overflow-hidden outline-none ${
          zoomLevel > 1
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Transform Layer - Applies Zoom & Pan (no dot grid - plain black) */}
        <div
          className="absolute inset-0 origin-center will-change-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            transition: isDragging.current
              ? "none"
              : "transform 0.15s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="relative border-2 border-white shadow-2xl bg-zinc-900 overflow-hidden"
              style={{
                aspectRatio:
                  boundingBox?.image_width && boundingBox?.image_height
                    ? `${boundingBox.image_width} / ${boundingBox.image_height}`
                    : "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                width: zoomLevel > 1 ? "100%" : "auto", // Allow image to define size unless zoomed
                height: zoomLevel > 1 ? "100%" : "auto",
              }}
            >
              {imageUrl ? (
                <img
                  key={imageUrl}
                  ref={imageRef}
                  src={imageUrl}
                  alt="Ultrasound Scan"
                  className={`max-w-full max-h-full block ${
                    imageMode === "processed"
                      ? "brightness-110 contrast-125"
                      : ""
                  }`}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    console.log("📸 Image Loaded Successfully:", {
                      url: imageUrl,
                      naturalWidth: img.naturalWidth,
                      naturalHeight: img.naturalHeight,
                    });
                    setNaturalSize({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                    setIsLoading(false);
                  }}
                  onError={() => {
                    console.error("❌ Image Load Error:", imageUrl);
                    setIsLoading(false);
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[120px] mb-4 blur-[1px] opacity-50 grayscale">
                    {imageMode === "original" ? "📷" : "🔮"}
                  </div>
                </div>
              )}

              {/* Mode Indicator Overlay */}
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-30">
                <p className="text-slate-500/50 font-mono text-[8px] uppercase tracking-[0.4em] drop-shadow-md">
                  {imageMode === "original"
                    ? "B-Mode / Raw"
                    : "AI Segmentation Overlay"}
                </p>
              </div>

              {/* AI Overlays - Bounding Box Overlay */}
              {imageMode === "processed" && boundingBox && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div
                    className={`absolute border-2 ${imageViewerColors.boundingBox.border} ${imageViewerColors.boundingBox.bg} ${imageViewerColors.boundingBox.shadow} backdrop-blur-[0.5px] transition-all`}
                    style={{
                      left: `${(boundingBox.x / (naturalSize?.width || boundingBox.image_width || 1)) * 100}%`,
                      top: `${(boundingBox.y / (naturalSize?.height || boundingBox.image_height || 1)) * 100}%`,
                      width: `${(boundingBox.width / (naturalSize?.width || boundingBox.image_width || 1)) * 100}%`,
                      height: `${(boundingBox.height / (naturalSize?.height || boundingBox.image_height || 1)) * 100}%`,
                    }}
                  >
                    <div
                      className={`absolute -top-6 left-0 ${imageViewerColors.boundingBox.labelBg} ${imageViewerColors.boundingBox.labelText} text-[10px] font-bold px-2 py-0.5 border ${imageViewerColors.boundingBox.labelBorder} rounded-sm whitespace-nowrap shadow-sm`}
                    >
                      NODULE DETECTED
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Overlay - Now on top of the image components */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-white text-xs font-mono tracking-widest uppercase opacity-70">
                Processing {imageMode === "original" ? "B-Mode" : "AI Features"}
                ...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlays UI - Stays Fixed on Screen (HUD) */}

      {/* Top Left - Patient/Scan Tech Data */}
      {/* <div className="absolute top-4 left-4 pointer-events-none font-mono text-[10px] text-emerald-500/80 flex flex-col gap-1 z-20 mix-blend-screen">
        <span>FR: 42Hz</span>
        <span>DR: 65dB</span>
        <span>GN: 48</span>
        <span>D: 4.0cm</span>
      </div> */}

      {/* Floating Controls - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black  border border-white/10 p-1.5 rounded-full shadow-2xl z-30 transition-opacity ">
        {/* Mode Switcher */}
        <div className="flex bg-white/5 rounded-full p-0.5 mr-2">
          <button
            onClick={() => onModeChange("original")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
              imageMode === "original"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => onModeChange("processed")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
              imageMode === "processed"
                ? imageViewerColors.modeButton.active
                : imageViewerColors.modeButton.inactive
            }`}
          >
            AI Analysis
          </button>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Zoom Controls */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.5}
          className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <span className="text-xs font-mono text-zinc-300 w-12 text-center select-none tabular-nums">
          {Math.round(zoomLevel * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          disabled={zoomLevel >= 4}
          className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          title="Reset View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

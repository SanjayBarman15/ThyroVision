"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon } from "lucide-react";
import { uploadStatusClasses } from "@/lib/colors";

interface StepUploadImageProps {
  file: File | null;
  previewUrl: string | null;
  onFileChange: (file: File) => void;
}

export const StepUploadImage = ({
  file,
  previewUrl,
  onFileChange,
}: StepUploadImageProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        onFileChange(droppedFile);
      }
    },
    [onFileChange]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-primary mb-2">
        <ImageIcon className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Ultrasound Image</h3>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative group flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-background/50 hover:border-secondary hover:bg-secondary/5"
          }
        `}
      >
        <div
          className={`p-4 rounded-full transition-colors ${
            file
              ? uploadStatusClasses.success
              : uploadStatusClasses.default
          }`}
        >
          <Upload className={`h-8 w-8 ${isDragging ? "animate-bounce" : ""}`} />
        </div>

        <div className="text-center space-y-1">
          <p className="font-semibold text-foreground">
            {file ? "File Selected" : "Drag and drop image here"}
          </p>
          <p className="text-sm text-muted-foreground">
            {file ? file.name : "or click to browse from computer"}
          </p>
          {!file && (
            <p className="text-xs text-muted-foreground pt-2">
              Supports PNG, JPG, JPEG, DCM (Max 50MB)
            </p>
          )}
        </div>

        <input
          type="file"
          accept=".png,.jpg,.jpeg,.dcm,image/*"
          onChange={(e) =>
            e.target.files?.[0] && onFileChange(e.target.files[0])
          }
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Upload ultrasound image"
        />
      </div>

      {previewUrl && (
        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            Image Preview
          </Label>
          <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-lg overflow-hidden border border-border bg-black shadow-inner">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-[10px] text-white/90 truncate font-mono">
                {file?.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

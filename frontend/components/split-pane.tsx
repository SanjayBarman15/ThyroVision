"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"

interface SplitPaneProps {
  children: [ReactNode, ReactNode]
}

export default function SplitPane({ children }: SplitPaneProps) {
  const [dividerPos, setDividerPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    // Load saved position from localStorage
    const saved = localStorage.getItem("split-pane-position")
    if (saved) {
      setDividerPos(Number(saved))
    }
  }, [])

  const handleMouseDown = () => {
    isDragging.current = true
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newPos = ((e.clientX - rect.left) / rect.width) * 100

      if (newPos > 30 && newPos < 70) {
        setDividerPos(newPos)
        localStorage.setItem("split-pane-position", newPos.toString())
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div style={{ width: `${dividerPos}%` }} className="overflow-y-auto border-r border-border bg-background">
        {children[0]}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize bg-border transition-colors hover:bg-secondary ${
          isDragging.current ? "bg-secondary" : ""
        }`}
      />

      <div style={{ width: `${100 - dividerPos}%` }} className="overflow-hidden bg-card">
        {children[1]}
      </div>
    </div>
  )
}

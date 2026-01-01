"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-primary">ThyroVision</h1>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 bg-transparent">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Mail, Lock, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.fullName) {
      setError("Please enter your full name")
      return
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email")
      return
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    // Mock registration - in real app, this would call an API
    setTimeout(() => {
      router.push("/dashboard")
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join ThyroVision for AI-assisted analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-900/30 p-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground mb-2 block">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="bg-input border-border text-foreground pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="bg-input border-border text-foreground pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-input border-border text-foreground pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground mb-2 block">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-input border-border text-foreground pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          >
            {isLoading ? "Creating account..." : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

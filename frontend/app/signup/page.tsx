"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { signup } from "../login/actions";

const initialState = {
  error: null,
};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(
    signup,
    initialState as { error: string | null }
  );

  // Note: Password match validation is ideally done client-side before submission or handled in server action
  // For simplicity using native required/minLength attributes here, but in production
  // you might want to add client-side validation logic back or do it in the server action.
  // The server action allows simplistic pass-through.

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Join ThyroVision for AI-assisted analysis
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="rounded-lg bg-red-900/20 border border-red-900/30 p-3">
              <p className="text-sm text-red-200">{state.error}</p>
            </div>
          )}

          <div>
            <Label
              htmlFor="fullName"
              className="text-sm font-medium text-foreground mb-2 block"
            >
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                className="bg-input border-border text-foreground pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground mb-2 block"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className="bg-input border-border text-foreground pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="text-sm font-medium text-foreground mb-2 block"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="bg-input border-border text-foreground pl-10"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              At least 8 characters
            </p>
          </div>

          {/* 
            For confirm password, we can add a client-side check or just rely on server.
            Since simple flow: omitting explicit match check here for brevity unless reusing client state.
            Can add standard Input but ignoring for now or adding as cosmetic.
           */}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          >
            {isPending ? "Creating account..." : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-secondary hover:underline font-medium"
            >
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

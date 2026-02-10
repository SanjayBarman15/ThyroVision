"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Stethoscope } from "lucide-react";
import Link from "next/link";
import { login } from "./actions";
import { authClasses, errorClasses } from "@/lib/colors";

const initialState = {
  error: null,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    login,
    initialState as { error: string | null },
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`${authClasses.page} flex items-center justify-center`}>
      <div className={authClasses.shell}>
        <div className={authClasses.header}>
          <div className={authClasses.mark}>
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className={authClasses.title}>Welcome back</h1>
          <p className={authClasses.subtitle}>
            Sign in to your ThyroSight account.
          </p>
        </div>

        <Card className={authClasses.card}>
          <div className={authClasses.cardInner}>
            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div className={`rounded-xl ${errorClasses.container} p-4`}>
                  <p className={`text-sm ${errorClasses.text} font-medium`}>
                    {state.error}
                  </p>
                </div>
              )}

              <div className={authClasses.field}>
                <Label htmlFor="email" className={authClasses.label}>
                  Email
                </Label>
                <div className={authClasses.inputWrap}>
                  <Mail className={authClasses.inputIcon} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@hospital.com"
                    className={authClasses.input}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={authClasses.field}>
                <Label htmlFor="password" className={authClasses.label}>
                  Password
                </Label>
                <div className={authClasses.inputWrap}>
                  <Lock className={authClasses.inputIcon} />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={authClasses.passwordInput}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={authClasses.passwordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className={authClasses.submit}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Signing in…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Sign in <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className={authClasses.footer}>
              <p className="text-sm text-muted-foreground text-center">
                New here?{" "}
                <Link href="/signup" className={authClasses.link}>
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </Card>

        <p className={authClasses.helper}>
          Secure medical imaging analysis platform.
        </p>
      </div>
    </div>
  );
}

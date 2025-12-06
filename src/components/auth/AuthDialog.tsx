"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  sendMagicLink,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/supabaseBrowser";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
};

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

export function AuthDialog({
  open,
  onOpenChange,
  onAuthSuccess,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    onOpenChange(false);
    setMode("sign-in");
    setEmail("");
    setPassword("");
    setErrorMessage(null);
    setForgotEmail("");
    setForgotMessage(null);
    setForgotError(null);
    setIsLoading(false);
    setIsSubmittingForgot(false);
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setForgotMessage(null);
    setForgotError(null);
    setIsSubmittingForgot(false);
    if (nextMode === "forgot-password") {
      setForgotEmail(email);
    } else {
      setForgotEmail("");
    }
  };

  const normalizeEmail = () => email.trim().toLowerCase();

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setForgotMessage(null);
    setForgotError(null);

    const normalizedEmail = normalizeEmail();
    if (!normalizedEmail || !password) {
      setErrorMessage("Please provide both email and password.");
      setIsLoading(false);
      return;
    }

    const { error } = await signInWithEmail(normalizedEmail, password);

    if (error) {
      setErrorMessage(error.message ?? "Incorrect email or password.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onAuthSuccess?.();
    handleClose();
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setForgotMessage(null);
    setForgotError(null);

    const normalizedEmail = normalizeEmail();
    if (!normalizedEmail || !password) {
      setErrorMessage("Please provide both email and password.");
      setIsLoading(false);
      return;
    }

    const signUpResult = await signUpWithEmail(normalizedEmail, password);

    if (signUpResult.error) {
      const message =
        signUpResult.error.message ?? "Unable to create an account. Please try again.";
      const alreadyRegistered = signUpResult.error.message
        ?.toLowerCase()
        .includes("already registered");

      if (alreadyRegistered) {
        setErrorMessage("This email is already registered, try signing in instead.");
      } else {
        setErrorMessage(message);
      }

      setIsLoading(false);
      return;
    }

    const signInResult = await signInWithEmail(normalizedEmail, password);
    if (signInResult.error) {
      setErrorMessage(
        signInResult.error.message ?? "Unable to sign in after creating your account.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onAuthSuccess?.();
    handleClose();
  };

  const handleForgotPasswordSubmit = async () => {
    const normalizedEmail = forgotEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setForgotError("Please enter your email.");
      setForgotMessage(null);
      return;
    }

    setIsSubmittingForgot(true);
    setForgotError(null);
    setForgotMessage(null);

    const { error } = await sendMagicLink(normalizedEmail);

    setIsSubmittingForgot(false);

    if (error) {
      console.error("[auth] forgot password error", error);
      setForgotError(
        "Something went wrong sending the reset email. Please try again in a moment.",
      );
      return;
    }

    setForgotMessage(
      "If an account exists for that email, we've sent a link to sign in. It may take a couple of minutes to arrive - don't forget to check your spam folder.",
    );
  };

  const isSignInMode = mode === "sign-in";
  const isForgotMode = mode === "forgot-password";
  const title = isForgotMode
    ? "Reset your password"
    : isSignInMode
      ? "Sign in"
      : "Create an account";
  const primaryLabel = isSignInMode ? "Sign in" : "Create account";
  const description = isForgotMode
    ? "Enter the email you use for WizardFolio. If an account exists, we'll email you a link to sign in or reset your password."
    : "We’ll save your mixes to this account so you can come back later.";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md space-y-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-black/20 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Wizardfolio
            </p>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-transparent p-1 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <span className="sr-only">Close sign in dialog</span>
            ✕
          </button>
        </div>

        {isForgotMode ? (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <button
              type="button"
              onClick={handleForgotPasswordSubmit}
              disabled={isSubmittingForgot || !forgotEmail.trim()}
              className="w-full rounded-2xl border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingForgot ? "Sending…" : "Send reset link"}
            </button>

            {forgotMessage && (
              <p className="text-xs text-emerald-600">{forgotMessage}</p>
            )}
            {forgotError && (
              <p className="text-xs text-rose-500">{forgotError}</p>
            )}

            <button
              type="button"
              onClick={() => handleModeChange("sign-in")}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <form
              onSubmit={isSignInMode ? handleSignIn : handleSignUp}
              className="space-y-3"
            >
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </label>
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </label>

              {isSignInMode && (
                <div className="space-y-1 text-sm">
                  <button
                    type="button"
                    onClick={() => handleModeChange("forgot-password")}
                    className="text-left font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-60"
              >
                {primaryLabel}
              </button>
            </form>

            {errorMessage && (
              <p className="text-sm text-rose-500">{errorMessage}</p>
            )}

            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
              {isSignInMode ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("sign-up")}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("sign-in")}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

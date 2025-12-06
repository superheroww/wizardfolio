 "use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/supabaseBrowser";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
};

export function AuthDialog({
  open,
  onOpenChange,
  onAuthSuccess,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    onOpenChange(false);
    setErrorMessage(null);
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle();
    } catch (error: any) {
      setErrorMessage(
        error?.message ?? "Unable to continue with Google. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Please provide both email and password.");
      setIsLoading(false);
      return;
    }

    const attemptSignIn = async () =>
      signInWithEmail(normalizedEmail, password);

    const attemptSignUp = async () =>
      signUpWithEmail(normalizedEmail, password);

    let result = await attemptSignIn();

    if (result.error) {
      const signUpResult = await attemptSignUp();
      if (signUpResult.error) {
        setErrorMessage(signUpResult.error.message);
        setIsLoading(false);
        return;
      }

      result = await attemptSignIn();
    }

    if (result.error) {
      setErrorMessage(result.error.message ?? "Unable to sign in. Please try again.");
      setIsLoading(false);
      return;
    }

    setEmail("");
    setPassword("");
    setIsLoading(false);
    onAuthSuccess?.();
    onOpenChange(false);
  };

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
              Personalize
            </p>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              Sign in to save your mix
            </h2>
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

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-900/10 bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-60 dark:border-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span>or</span>
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-60"
          >
            Continue with email
          </button>
        </form>

        {errorMessage && (
          <p className="text-sm text-rose-500">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

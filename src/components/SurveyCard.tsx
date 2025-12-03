"use client";

import * as React from "react";

const FEATURE_OPTIONS = [
  "More ETF coverage",
  "Connect my real portfolio",
  "More ETF insights & charts",
  "Support Canadian account types (TFSA, RRSP, LIRA…)",
  "Sun Life / Manulife PDF support",
  "Multi-currency insights (CAD vs USD)",
  "Something else…",
];

type SubmissionState = "idle" | "loading" | "success" | "error";

export default function SurveyCard() {
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<SubmissionState>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const hasSomethingElse = selectedFeatures.includes("Something else…");
  const isSubmitting = state === "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFeatures.length) {
      setError("Pick at least one option.");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFeatures,
          message: message.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setState("success");
    } catch (err) {
      console.error(err);
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-[--color-border-subtle] bg-[--color-muted] p-4 text-left shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
          Thank you ✨
        </p>
        <h3 className="mt-1 text-sm font-semibold text-[--color-foreground]">
          You’re officially helping design WizardFolio.
        </h3>
        <p className="mt-2 text-xs text-[--color-text-muted]">
          We’ll use this to decide what to build next. If you left an email,
          we’ll ping you as new features go live.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col rounded-2xl border border-[--color-border-subtle] bg-[--color-muted] p-4 text-left shadow-sm"
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
        Help shape WizardFolio
      </p>
      <h3 className="mt-1 text-sm font-semibold text-[--color-foreground]">
        What would you love to see next?
      </h3>
      <p className="mt-1 text-xs text-[--color-text-muted]">
        Tap a few wishes below. Optional: add your email and we’ll let you know
        when new features land.
      </p>

      {/* Feature chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {FEATURE_OPTIONS.map((feature) => {
          const selected = selectedFeatures.includes(feature);
          return (
            <button
              key={feature}
              type="button"
              onClick={() => toggleFeature(feature)}
              className={[
                "rounded-full border px-3 py-1 text-xs transition",
                selected
                  ? "border-[--color-accent] bg-[--color-accent] text-white shadow-sm"
                  : "border-[--color-border-subtle] bg-[--color-background] text-[--color-foreground] hover:bg-[--color-muted]",
              ].join(" ")}
            >
              {feature}
            </button>
          );
        })}
      </div>

      {/* Something else textarea */}
      {hasSomethingElse && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-[--color-foreground]">
            Something else you wish WizardFolio could do?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[--color-border-subtle] bg-[--color-background] p-2 text-xs text-[--color-foreground] outline-none ring-0 focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
            placeholder="e.g., See all my accounts in one place, more credit card insights, etc."
          />
        </div>
      )}

      {/* Email input */}
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-[--color-foreground]">
          Email (optional)
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[--color-border-subtle] bg-[--color-background] px-3 py-2 text-xs text-[--color-foreground] outline-none ring-0 focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
          placeholder="you@example.com"
        />
        <p className="mt-1 text-[10px] text-[--color-text-muted]">
          Optional. We’ll only email you about WizardFolio updates.
        </p>
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-red-500">
          {error}
        </p>
      )}
      {state === "error" && !error && (
        <p className="mt-2 text-[11px] text-red-500">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !selectedFeatures.length}
          className={[
            "inline-flex flex-1 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition",
            isSubmitting || !selectedFeatures.length
              ? "bg-[--color-muted-strong] text-[--color-text-muted]"
              : "bg-[--color-accent] text-white shadow-sm hover:opacity-90",
          ].join(" ")}
        >
          {isSubmitting ? "Sending..." : "Send my wishlist"}
        </button>
      </div>
    </form>
  );
}

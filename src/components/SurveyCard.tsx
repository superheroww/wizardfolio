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
      <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white/70 p-4 text-left shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-600">
          Thank you ✨
        </p>
        <h3 className="mt-1 text-base font-semibold text-neutral-900">
          You’re officially helping design WizardFolio.
        </h3>
        <p className="mt-2 text-sm text-neutral-700">
          We’ll use this to decide what to build next. If you left an email,
          we’ll ping you as new features go live.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white/70 p-4 text-left shadow-sm"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
        Help shape WizardFolio
      </p>
      <h3 className="mt-1 text-base font-semibold text-neutral-900">
        What would you love to see next?
      </h3>
      <p className="mt-1 text-sm text-neutral-700">
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
                "rounded-full border px-3 py-1 text-sm transition",
                selected
                  ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                  : "border-neutral-200 bg-white/60 text-neutral-700 hover:border-neutral-300",
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
          <label className="mb-1 block text-sm text-neutral-700">
            Something else you wish WizardFolio could do?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-neutral-200 bg-white/80 p-3 text-sm text-neutral-900 outline-none ring-0 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g., See all my accounts in one place etc."
          />
        </div>
      )}

      {/* Email input */}
      <div className="mt-3">
        <label className="mb-1 block text-sm text-neutral-700">
          Email (optional)
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="you@example.com"
        />
        <p className="mt-1 text-[11px] text-neutral-500">
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
            "inline-flex flex-1 items-center justify-center rounded-full px-3 py-2 text-sm font-semibold transition",
            isSubmitting || !selectedFeatures.length
              ? "bg-neutral-300 text-neutral-600"
              : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
          ].join(" ")}
        >
          {isSubmitting ? "Sending..." : "Send my wishlist"}
        </button>
      </div>
    </form>
  );
}

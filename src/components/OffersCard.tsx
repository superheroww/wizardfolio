"use client";

import * as React from "react";

type BrokerType = "wealthsimple" | "questrade";

type OffersCardProps = {
  broker: BrokerType;
  simpliiReferralUrl?: string;
  wealthsimpleReferralUrl?: string;
  questradeReferralUrl?: string;
};

export default function OffersCard({
  broker,
  simpliiReferralUrl,
  wealthsimpleReferralUrl,
  questradeReferralUrl,
}: OffersCardProps) {
  const handleOpen = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderBrokerTile = () => {
    if (broker === "wealthsimple") {
      return (
        <div className="flex flex-col justify-between rounded-2xl border border-sky-100 bg-white/80 p-3 text-xs shadow-sm dark:border-sky-900/40 dark:bg-zinc-900">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
              Wealthsimple
            </p>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
              New to Wealthsimple? Sign up with my link and fund an eligible
              account to unlock their current referral bonus.
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              For new Wealthsimple clients only. Funding and eligibility rules
              apply. Bonus amounts and terms may change. Always check the latest
              referral terms.
            </p>
          </div>

          <button
            type="button"
            disabled={!wealthsimpleReferralUrl}
            onClick={() => handleOpen(wealthsimpleReferralUrl)}
            className="mt-2 inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Use Wealthsimple invite
          </button>
        </div>
      );
    }

    // Questrade tile
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white/80 p-3 text-xs shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Questrade
          </p>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
            Opening a Questrade self-directed or Questwealth account? Using my
            link and funding with at least $250 unlocks a referral cash reward
            for both of us.
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            For new Questrade clients only. Minimum funding, timing and account
            eligibility rules apply. Referral rewards count as contributions in
            registered accounts.
          </p>
        </div>

        <button
          type="button"
          disabled={!questradeReferralUrl}
          onClick={() => handleOpen(questradeReferralUrl)}
          className="mt-2 inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Use Questrade invite
        </button>
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
      
      {/* TITLE CHANGE REQUESTED */}
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
          Optional Perks
        </p>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Small bonuses if you're opening accounts anyway
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          These are completely optional — but if you're already planning to open
          or move an account, these links can give a little boost.
        </p>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Simplii */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-100 bg-white/80 p-3 text-xs shadow-sm dark:border-amber-900/40 dark:bg-zinc-900">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Simplii Financial™
            </p>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
              New to Simplii? Open an eligible no-fee account with my link and,
              once you meet the deposit or spend requirement, we both earn a
              cash reward.
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              For new clients only. Canadian residents (no Quebec). Funding/
              spend rules apply; see Simplii's full terms.
            </p>
          </div>

          <button
            type="button"
            disabled={!simpliiReferralUrl}
            onClick={() => handleOpen(simpliiReferralUrl)}
            className="mt-2 inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Use Simplii invite
          </button>
        </div>

        {/* Broker (WS or QT) */}
        {renderBrokerTile()}
      </div>

      {/* FOOTNOTE */}
      <p className="mt-3 text-[10px] text-zinc-400 dark:text-zinc-600">
        WizardFolio doesn’t run these promotions — they come directly from each
        institution. Always check their latest terms.
      </p>
    </section>
  );
}
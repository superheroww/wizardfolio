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
        <div className="flex flex-col justify-between rounded-2xl border border-sky-100 bg-white/80 p-3 text-sm shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">
              Wealthsimple
            </p>
            <p className="text-sm text-neutral-700">
              New to Wealthsimple? Sign up with my link and fund an eligible
              account to unlock their current referral bonus.
            </p>
            <p className="text-[11px] text-neutral-500">
              For new Wealthsimple clients only. Funding and eligibility rules
              apply. Bonus amounts and terms may change. Always check the latest
              referral terms.
            </p>
          </div>

          <button
            type="button"
            disabled={!wealthsimpleReferralUrl}
            onClick={() => handleOpen(wealthsimpleReferralUrl)}
            className="mt-2 inline-flex items-center rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use Wealthsimple invite
          </button>
        </div>
      );
    }

    // Questrade tile
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white/80 p-3 text-sm shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-neutral-900">
            Questrade
          </p>
          <p className="text-sm text-neutral-700">
            Opening a Questrade self-directed or Questwealth account? Using my
            link and funding with at least $250 unlocks a referral cash reward
            for both of us.
          </p>
          <p className="text-[11px] text-neutral-500">
            For new Questrade clients only. Minimum funding, timing and account
            eligibility rules apply. Referral rewards count as contributions in
            registered accounts.
          </p>
        </div>

        <button
          type="button"
          disabled={!questradeReferralUrl}
          onClick={() => handleOpen(questradeReferralUrl)}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-[#00A54F] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#009247] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Use Questrade invite
        </button>
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 shadow-sm">
      {/* TITLE */}
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          Optional Perks
        </p>
        <h3 className="text-base font-semibold text-neutral-900">
          Small bonuses if you're opening accounts anyway
        </h3>
        <p className="text-sm text-neutral-700">
          These are completely optional — but if you're already planning to open
          or move an account, these links can give a little boost.
        </p>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Simplii */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-100 bg-white/80 p-3 text-sm shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">
              Simplii Financial™
            </p>
            <p className="text-sm text-neutral-700">
              New to Simplii? Open an eligible no-fee account with my link and,
              once you meet the deposit or spend requirement, we both earn a
              cash reward.
            </p>
            <p className="text-[11px] text-neutral-500">
              For new clients only. Canadian residents (no Quebec). Funding/
              spend rules apply; see Simplii&apos;s full terms.
            </p>
          </div>

          <button
            type="button"
            disabled={!simpliiReferralUrl}
            onClick={() => handleOpen(simpliiReferralUrl)}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-[#FFCF33] px-3 py-1.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#F5C000] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use Simplii invite
          </button>
        </div>

        {/* Broker (WS or QT) */}
        {renderBrokerTile()}
      </div>

      {/* FOOTNOTE */}
      <p className="mt-3 text-[11px] text-neutral-500">
        WizardFolio doesn’t run these promotions — they come directly from each
        institution. Always check their latest terms.
      </p>
    </section>
  );
}

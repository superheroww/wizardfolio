"use client";

import type { Template } from "@/lib/quickStartTemplates";
import type { UserPosition } from "@/lib/exposureEngine";

type TopLovedMixesProps = {
  mixes: Template[];
  onSelect: (positions: UserPosition[], template: Template) => void;
};

export function TopLovedMixes({ mixes, onSelect }: TopLovedMixesProps) {
  if (!mixes || mixes.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="mt-3 space-y-2">
        {mixes.map((mix) => (
          <button
            key={mix.id}
            type="button"
            onClick={() => onSelect(mix.positions, mix)}
            className="flex w-full items-start justify-between rounded-xl border border-neutral-200 px-3 py-2 text-left text-sm hover:bg-neutral-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{mix.emoji}</span>
                <span className="font-medium text-neutral-900">{mix.name}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{mix.description}</p>
            </div>
            <span className="ml-3 text-xs text-neutral-400">›</span>
          </button>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-neutral-400">
        We’ll reload WizardFolio with your chosen mix prefilled so you can
        see its true exposure in one tap.
      </p>
    </section>
  );
}

export default TopLovedMixes;

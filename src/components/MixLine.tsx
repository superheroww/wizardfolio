"use client";

import type { UserPosition } from "@/lib/exposureEngine";
import { mixLineFromPositions } from "@/lib/mixFormatting";

type MixLineProps = {
  positions: UserPosition[];
};

export default function MixLine({ positions }: MixLineProps) {
  const mixLine = mixLineFromPositions(positions);
  if (!mixLine) {
    return null;
  }

  return (
    <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {mixLine}
    </p>
  );
}

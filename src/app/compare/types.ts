"import type { UserPosition } from "@/lib/exposureEngine";

export type CompareSavedMix = {
  id: string;
  name: string;
  positions: UserPosition[];
};

export type CompareSlotSource = "saved" | "benchmark" | "template" | "scratch";

export type CompareSelectionSource = CompareSlotSource;

export type CompareSelection = {
  id: string;
  label: string;
  positions: UserPosition[];
  source: CompareSelectionSource;
};

export type CompareSlotId = "A" | "B";
export type CompareSelectorTabId =
  | "your-mixes"
  | "benchmarks"
  | "scratch"
  | "templates";

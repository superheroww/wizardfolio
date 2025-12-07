import type { UserPosition } from "@/lib/exposureEngine";

export type CompareSavedMix = {
  id: string;
  name: string;
  positions: UserPosition[];
};

export type CompareSelectionSource =
  | "mixes"
  | "benchmarks"
  | "templates"
  | "scratch";

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

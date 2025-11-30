import { type BenchmarkExposureRow } from "@/lib/benchmarkExposure";

const normalizeLabel = (value?: string | null) => {
  return (value?.trim() || "Other").toLowerCase();
};

const friendlyLabel = (value?: string | null) => {
  return value?.trim() || "Other";
};

const formatDelta = (value: number) => {
  if (Number.isNaN(value)) {
    return "0.0%";
  }

  const rounded = value.toFixed(1);
  return value >= 0 ? `+${rounded}%` : `${rounded}%`;
};

export type GroupExposure = {
  label: string;
  weightPct: number;
};

export type TiltRow = {
  label: string;
  delta: number;
  deltaFormatted: string;
};

export type TiltSummary = {
  overweights: TiltRow[];
  underweights: TiltRow[];
};

export function calculateTilts(
  userExposure: GroupExposure[],
  benchmarkExposure: BenchmarkExposureRow[],
  limit = 5,
): TiltSummary {
  const buckets = new Map<
    string,
    { label: string; user: number; benchmark: number }
  >();

  const addEntry = (key: string, label: string) => {
    if (!buckets.has(key)) {
      buckets.set(key, { label, user: 0, benchmark: 0 });
    }
    return buckets.get(key)!;
  };

  for (const row of userExposure ?? []) {
    const key = normalizeLabel(row.label);
    const label = friendlyLabel(row.label);
    const entry = addEntry(key, label);
    entry.user = row.weightPct ?? 0;
  }

  for (const row of benchmarkExposure ?? []) {
    const key = normalizeLabel(row.group_key);
    const label = friendlyLabel(row.group_key);
    const entry = addEntry(key, label);
    entry.benchmark = row.weight_pct ?? 0;
  }

  const entries = Array.from(buckets.values()).map((entry) => ({
    label: entry.label,
    delta: entry.user - entry.benchmark,
  }));

  const overweights = entries
    .filter((entry) => entry.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      deltaFormatted: formatDelta(entry.delta),
    }));

  const underweights = entries
    .filter((entry) => entry.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      deltaFormatted: formatDelta(entry.delta),
    }));

  return { overweights, underweights };
}

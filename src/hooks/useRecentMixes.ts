import { useCallback, useEffect, useState } from "react";
import type { UserPosition } from "@/lib/exposureEngine";

export type RecentMixSource = "local" | "remote";

export type RecentMix = {
  id: string;
  label: string;
  positions: UserPosition[];
  source: RecentMixSource;
  createdAt: string;
};

const LOCAL_STORAGE_KEY = "wizardfolio_recent_mixes_v1";
const MAX_LOCAL_MIXES = 5;

function safeParseRecentMixes(raw: string | null): RecentMix[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && Array.isArray((m as any).positions))
      .map((m) => ({
        id: String((m as any).id ?? crypto.randomUUID?.() ?? Date.now().toString()),
        label: String((m as any).label ?? "Custom mix"),
        positions: (m as any).positions as UserPosition[],
        source: ((m as any).source === "remote" ? "remote" : "local") as RecentMixSource,
        createdAt: String((m as any).createdAt ?? new Date().toISOString()),
      }));
  } catch {
    return [];
  }
}

function serializeRecentMixes(mixes: RecentMix[]): string {
  return JSON.stringify(mixes);
}

function buildLabelFromPositions(positions: UserPosition[]): string {
  if (!positions || positions.length === 0) return "Custom mix";
  const parts = positions.slice(0, 3).map((p) => {
    const symbol = (p as any).symbol ?? "ETF";
    const weight = (p as any).weightPct ?? (p as any).weight_pct ?? null;
    if (typeof weight === "number") {
      return `${symbol} ${Math.round(weight)}%`;
    }
    return symbol;
  });
  return parts.join(" + ");
}

export type UseRecentMixesOptions = {
  remoteMixes?: {
    id: string;
    label: string;
    positions: UserPosition[];
    createdAt?: string;
  }[];
};

export type UseRecentMixesResult = {
  recentMixes: RecentMix[];
  addLocalMix: (positions: UserPosition[]) => void;
  hydrateFromRemote: (
    remoteMixes: UseRecentMixesOptions["remoteMixes"],
  ) => void;
  clearLocalMixes: () => void;
};

export function useRecentMixes(
  options: UseRecentMixesOptions = {},
): UseRecentMixesResult {
  const [recentMixes, setRecentMixes] = useState<RecentMix[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = safeParseRecentMixes(
      window.localStorage.getItem(LOCAL_STORAGE_KEY),
    );
    setRecentMixes(stored);
  }, []);

  useEffect(() => {
    if (!options.remoteMixes || options.remoteMixes.length === 0) return;

    setRecentMixes((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const remoteAsRecent: RecentMix[] = options.remoteMixes!.map((m) => ({
        id: m.id,
        label: m.label ?? buildLabelFromPositions(m.positions),
        positions: m.positions,
        source: "remote",
        createdAt: m.createdAt ?? new Date().toISOString(),
      }));

      const merged = [
        ...remoteAsRecent.filter((m) => !existingIds.has(m.id)),
        ...prev,
      ];

      const seen = new Set<string>();
      const deduped: RecentMix[] = [];
      for (const mix of merged) {
        if (seen.has(mix.id)) continue;
        seen.add(mix.id);
        deduped.push(mix);
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          serializeRecentMixes(deduped.filter((m) => m.source === "local")),
        );
      }

      return deduped;
    });
  }, [options.remoteMixes]);

  const persistLocal = useCallback((nextLocalMixes: RecentMix[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      serializeRecentMixes(nextLocalMixes),
    );
  }, []);

  const addLocalMix = useCallback(
    (positions: UserPosition[]) => {
      if (!positions || positions.length === 0) return;

      const label = buildLabelFromPositions(positions);
      const newMix: RecentMix = {
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        label,
        positions,
        source: "local",
        createdAt: new Date().toISOString(),
      };

      setRecentMixes((prev) => {
        const localOnly = prev.filter((m) => m.source === "local");
        const newLocal = [newMix, ...localOnly];

        const seenLabels = new Set<string>();
        const dedupedLocal: RecentMix[] = [];
        for (const mix of newLocal) {
          if (seenLabels.has(mix.label)) continue;
          seenLabels.add(mix.label);
          dedupedLocal.push(mix);
        }

        const trimmedLocal = dedupedLocal.slice(0, MAX_LOCAL_MIXES);

        const remote = prev.filter((m) => m.source === "remote");
        const combined = [...trimmedLocal, ...remote];

        persistLocal(trimmedLocal);
        return combined;
      });
    },
    [persistLocal],
  );

  const clearLocalMixes = useCallback(() => {
    setRecentMixes((prev) => {
      const remote = prev.filter((m) => m.source === "remote");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      return remote;
    });
  }, []);

  const hydrateFromRemote = useCallback(
    (remoteMixes: UseRecentMixesOptions["remoteMixes"]) => {
      if (!remoteMixes || remoteMixes.length === 0) return;
      setRecentMixes((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const remoteAsRecent: RecentMix[] = remoteMixes!.map((m) => ({
          id: m.id,
          label: m.label ?? buildLabelFromPositions(m.positions),
          positions: m.positions,
          source: "remote",
          createdAt: m.createdAt ?? new Date().toISOString(),
        }));

        const merged = [
          ...remoteAsRecent.filter((m) => !existingIds.has(m.id)),
          ...prev,
        ];

        const seen = new Set<string>();
        const deduped: RecentMix[] = [];
        for (const mix of merged) {
          if (seen.has(mix.id)) continue;
          seen.add(mix.id);
          deduped.push(mix);
        }

        return deduped;
      });
    },
    [],
  );

  return { recentMixes, addLocalMix, hydrateFromRemote, clearLocalMixes };
}

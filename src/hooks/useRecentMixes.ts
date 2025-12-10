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

function buildNormalizedMixKey(positions: UserPosition[]): string | null {
  if (!positions || positions.length === 0) return null;

  const entries = positions
    .map((p) => ({
      symbol: (p as any).symbol?.trim().toUpperCase?.() ?? "",
      weight:
        typeof (p as any).weightPct === "number"
          ? (p as any).weightPct
          : typeof (p as any).weight_pct === "number"
            ? (p as any).weight_pct
            : 0,
    }))
    .filter((p) => p.symbol && p.weight > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  if (entries.length === 0) return null;

  return entries
    .map((p) => `${p.symbol}:${p.weight.toFixed(1)}`)
    .join("|");
}

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
  addLocalMixSnapshot: (
    positions: UserPosition[],
  ) => { didAdd: boolean; mixId: string | null; key: string | null };
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

  const addLocalMixSnapshot = useCallback(
    (positions: UserPosition[]) => {
      if (!positions || positions.length === 0) {
        return { didAdd: false, mixId: null, key: null };
      }

      const normalizedKey = buildNormalizedMixKey(positions);
      let didAdd = false;
      let mixId: string | null = null;

      setRecentMixes((prev) => {
        const localOnly = prev.filter((m) => m.source === "local");
        const lastLocal = localOnly[0];
        const lastKey = lastLocal ? buildNormalizedMixKey(lastLocal.positions) : null;

        if (lastKey && normalizedKey && lastKey === normalizedKey) {
          return prev;
        }

        const label = buildLabelFromPositions(positions);
        const newMix: RecentMix = {
          id: crypto.randomUUID?.() ?? `${Date.now()}`,
          label,
          positions,
          source: "local",
          createdAt: new Date().toISOString(),
        };

        didAdd = true;
        mixId = newMix.id;

        const newLocal = [newMix, ...localOnly];
        const trimmedLocal = newLocal.slice(0, MAX_LOCAL_MIXES);
        const remote = prev.filter((m) => m.source === "remote");
        const combined = [...trimmedLocal, ...remote];

        persistLocal(trimmedLocal);
        return combined;
      });

      return { didAdd, mixId, key: normalizedKey };
    },
    [persistLocal],
  );

  const addLocalMix = useCallback(
    (positions: UserPosition[]) => {
      void addLocalMixSnapshot(positions);
    },
    [addLocalMixSnapshot],
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

  return {
    recentMixes,
    addLocalMix,
    addLocalMixSnapshot,
    hydrateFromRemote,
    clearLocalMixes,
  };
}

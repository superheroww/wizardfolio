"use client";

import { useEffect, useState } from "react";
import { fetchBenchmarkExposure, type BenchmarkExposureRow } from "@/lib/benchmarkExposure";

export type ExposureGroup = "stock" | "sector" | "region";

type UseBenchmarkExposureResult = {
  data: BenchmarkExposureRow[];
  isLoading: boolean;
  error: string | null;
};

export function useBenchmarkExposure(
  benchmarkSymbol: string,
  groupBy: ExposureGroup,
): UseBenchmarkExposureResult {
  const [data, setData] = useState<BenchmarkExposureRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!benchmarkSymbol) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    fetchBenchmarkExposure(benchmarkSymbol, groupBy)
      .then((payload) => {
        if (!isActive) return;
        setData(payload);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Benchmark exposure fetch failed", err);
        setError(err?.message || "Unable to load benchmark exposure.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [benchmarkSymbol, groupBy]);

  return { data, isLoading, error };
}

"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPosition } from "@/lib/exposureEngine";
import PortfolioInput from "@/components/PortfolioInput";
import { DEFAULT_POSITIONS } from "@/data/defaultPositions";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const positionsParam = searchParams.get("positions");

  const initialPositions = useMemo<UserPosition[]>(() => {
    if (!positionsParam) return DEFAULT_POSITIONS;

    try {
      const decoded = decodeURIComponent(positionsParam);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        return parsed as UserPosition[];
      }
    } catch (err) {
      console.error("Failed to parse positions from URL", err);
    }

    return DEFAULT_POSITIONS;
  }, [positionsParam]);

  const [positions, setPositions] = useState<UserPosition[]>(initialPositions);

  // when the URL query changes (coming back from /results), sync state
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  const handleAnalyze = () => {
    const payload = encodeURIComponent(JSON.stringify(positions));
    router.push(`/results?positions=${payload}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <PortfolioInput
          positions={positions}
          onChange={(next) => setPositions(next)}
          onAnalyze={handleAnalyze}
        />
      </div>
    </div>
  );
}
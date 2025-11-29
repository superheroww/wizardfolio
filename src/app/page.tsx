"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PortfolioInput from "@/components/PortfolioInput";
import { DEFAULT_POSITIONS } from "@/data/defaultPositions";
import { UserPosition } from "@/lib/exposureEngine";
import {
  buildPositionsSearchParams,
  normalizePositions,
} from "@/lib/positionsQuery";

function parsePositionsFromUrl(raw: string | null): UserPosition[] {
  if (!raw) return [];

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);

    if (Array.isArray(parsed)) {
      return parsed as UserPosition[];
    }
  } catch (error) {
    console.error("Failed to parse positions from URL:", error, raw);
  }

  return [];
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive positions from URL (if present)
  const positionsFromUrl = useMemo(() => {
    const raw = searchParams.get("positions");
    return parsePositionsFromUrl(raw);
  }, [searchParams]);

  // Local positions state drives PortfolioInput
  const [positions, setPositions] = useState<UserPosition[]>(
    (positionsFromUrl.length
      ? positionsFromUrl
      : (DEFAULT_POSITIONS as UserPosition[]))
  );

  // If URL positions change (e.g., via back/forward), sync them into state
  useEffect(() => {
    if (positionsFromUrl.length) {
      setPositions(positionsFromUrl);
    }
  }, [positionsFromUrl]);

  const handleAnalyze = () => {
    const cleanedPositions = normalizePositions(positions);
    if (!cleanedPositions.length) {
      return;
    }

    const params = buildPositionsSearchParams(cleanedPositions);
    if (!params) {
      return;
    }

    router.push(`/results?${params}`);
  };

  return (
    <div className="space-y-4">
      <PortfolioInput
        positions={positions}
        onChange={setPositions}
        onAnalyze={handleAnalyze}
      />
    </div>
  );
}
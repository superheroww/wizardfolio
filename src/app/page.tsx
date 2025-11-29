"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PortfolioInput from "@/components/PortfolioInput";
import { DEFAULT_POSITIONS } from "@/data/defaultPositions";
import { UserPosition } from "@/lib/exposureEngine";
import { buildPositionsSearchParams } from "@/lib/positionsQuery";

export default function HomePage() {
  const router = useRouter();

  // Local positions state drives PortfolioInput
  const [positions, setPositions] = useState<UserPosition[]>(
    DEFAULT_POSITIONS as UserPosition[]
  );

  const handleAnalyze = () => {
    const params = buildPositionsSearchParams(positions);
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

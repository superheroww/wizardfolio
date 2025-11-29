import ResultsPageClient from "./ResultsPageClient";
import { parsePositionsParam, buildPositionsSearchParams } from "@/lib/positionsQuery";
import { UserPosition } from "@/lib/exposureEngine";
import { DEFAULT_POSITIONS } from "@/data/defaultPositions";

type ResultsPageProps = {
  searchParams?: {
    positions?: string | string[];
  };
};

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const parsed = parsePositionsParam(searchParams?.positions);
  const positions =
    parsed.length > 0 ? parsed : (DEFAULT_POSITIONS as UserPosition[]);
  const positionsQueryString = buildPositionsSearchParams(positions);

  return (
    <ResultsPageClient
      initialPositions={positions}
      positionsQueryString={positionsQueryString}
    />
  );
}

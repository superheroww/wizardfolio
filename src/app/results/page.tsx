// src/app/results/page.tsx
import ResultsPageClient from "./ResultsPageClient";
import { UserPosition } from "@/lib/exposureEngine";
// import { DEFAULT_POSITIONS } from "@/data/defaultPositions"; // optional fallback

type ResultsPageSearchParams = {
  positions?: string;
};

type ResultsPageProps = {
  // Handle both old (object) and new (Promise) behaviours
  searchParams: ResultsPageSearchParams | Promise<ResultsPageSearchParams>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  // ✅ Normalize async/sync searchParams
  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams ?? {};

  const positionsQueryString = resolvedSearchParams.positions ?? "";

  let initialPositions: UserPosition[] = [];
  let hasPositionsParam = false;

  if (positionsQueryString) {
    try {
      const decoded = decodeURIComponent(positionsQueryString);
      const parsed = JSON.parse(decoded);

      if (Array.isArray(parsed) && parsed.length > 0) {
        initialPositions = parsed as UserPosition[];
        hasPositionsParam = true;
      }
    } catch (error) {
      console.error(
        "Failed to parse positions from searchParams:",
        error,
        positionsQueryString,
      );
    }
  }

  // If nothing came from the URL, you can either:
  // (a) show an empty state:
  if (!hasPositionsParam) {
    initialPositions = [{ symbol: "", weightPct: 0 }];
  }

  // or (b) fall back to your demo/default portfolio:
  // if (!hasPositionsParam) {
  //   initialPositions = DEFAULT_POSITIONS;
  // }

  return (
    <ResultsPageClient
      initialPositions={initialPositions}
      positionsQueryString={positionsQueryString}
      hasPositionsParam={hasPositionsParam}
    />
  );
}
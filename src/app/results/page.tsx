// src/app/results/page.tsx
import ResultsPageClient from "./ResultsPageClient";
import { UserPosition } from "@/lib/exposureEngine";
import { headers } from "next/headers";
import { getTopLovedTemplates } from "@/lib/getTopLovedTemplates";
import { QUICK_START_TEMPLATES, type Template } from "@/lib/quickStartTemplates";
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

  const headerStore = await headers();
  const countryCode = headerStore.get("x-vercel-ip-country") ?? null;

  let topLoved: Template[] = await getTopLovedTemplates({
    limit: 4,
    days: 30,
    countryCode,
  });

  // If we have too little country-specific data, fallback to global templates
  if (!topLoved || topLoved.length <= 2) {
    topLoved = QUICK_START_TEMPLATES.slice(0, 4);
  }

  return (
    <ResultsPageClient
      initialPositions={initialPositions}
      hasPositionsParam={hasPositionsParam}
      topLoved={topLoved}
    />
  );
}

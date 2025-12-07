import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { ApiExposureRow, UserPosition } from "@/lib/exposureEngine";
import { parsePositionsParam } from "@/lib/positionsQuery";
import { fetchExposureRows } from "@/lib/exposureService";
import {
  computeCountryExposure,
  getTopSectors,
} from "@/lib/exposureInsights";
import {
  formatShareCardTickers,
  getSortedMixPositions,
} from "@/lib/mixFormatting";
import { aggregateHoldingsBySymbol } from "@/lib/exposureAggregations";

export const runtime = "edge";
export const size = {
  width: 1080,
  height: 1080,
};
export const contentType = "image/png";

const DONUT_COLORS = ["#9CB9E9", "#F5D0D0", "#F9E1B8", "#C9E0C6", "#CFD5EA"];
const DONUT_SIZE = 240;
const DONUT_RADIUS = 85;
const DONUT_STROKE = 18;
const DONUT_CENTER = DONUT_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

type DonutSegment = {
  color: string;
  dashArray: [number, number];
  dashOffset: number;
  label: string;
  weightPct: number;
};

type LegendEntry = {
  label: string;
  weightPct: number;
  color: string;
};

function aggregatePositions(positions: UserPosition[]): UserPosition[] {
  const map = new Map<string, number>();

  for (const pos of positions) {
    const symbol = pos.symbol?.trim().toUpperCase();
    const weight = Number(pos.weightPct) || 0;
    if (!symbol || weight <= 0) continue;
    map.set(symbol, (map.get(symbol) ?? 0) + weight);
  }

  return Array.from(map.entries()).map(([symbol, weightPct]) => ({
    symbol,
    weightPct,
  }));
}

function buildDonutSegments(positions: UserPosition[]): DonutSegment[] {
  if (!positions.length) {
    return [];
  }

  const aggregated = aggregatePositions(positions);
  const sorted = getSortedMixPositions(aggregated);
  const total = sorted.reduce((sum, pos) => sum + (pos.weightPct ?? 0), 0);
  if (total <= 0) {
    return [];
  }

  let offset = 0;
  return sorted.map((pos, idx) => {
    const ratio = (pos.weightPct ?? 0) / total;
    const length = ratio * CIRCUMFERENCE;
    const dashArray = [length, CIRCUMFERENCE];
    const dashOffset = -offset;
    offset += length;

    return {
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
      dashArray,
      dashOffset,
      label: pos.symbol.trim().toUpperCase(),
      weightPct: pos.weightPct ?? 0,
    };
  });
}

function buildLegendEntries(
  positions: UserPosition[],
  limit = 4,
): LegendEntry[] {
  const aggregated = aggregatePositions(positions);
  const sorted = getSortedMixPositions(aggregated);
  return sorted.slice(0, limit).map((pos, idx) => ({
    label: pos.symbol.trim().toUpperCase(),
    weightPct: pos.weightPct ?? 0,
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
  }));
}

function getTopHoldings(
  exposureRows: ApiExposureRow[],
  limit = 3,
): { label: string; percent: number }[] {
  const aggregated = aggregateHoldingsBySymbol(exposureRows);
  return aggregated
    .sort(
      (a, b) =>
        (b.total_weight_pct ?? 0) - (a.total_weight_pct ?? 0),
    )
    .slice(0, limit)
    .map((row) => ({
      label: row.holding_symbol?.trim().toUpperCase() || "—",
      percent: row.total_weight_pct ?? 0,
    }));
}

function formatPercentValue(value: number | undefined): string {
  if (!Number.isFinite(value ?? NaN)) return "0%";
  const rounded = Math.round((value ?? 0) * 10) / 10;
  return rounded % 1 === 0
    ? `${rounded.toFixed(0)}%`
    : `${rounded.toFixed(1)}%`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const positionsParam = searchParams.get("positions");
    const positions = parsePositionsParam(positionsParam);
    const hasPositions = positions.length > 0;

    let exposureRows: ApiExposureRow[] = [];
    if (hasPositions) {
      try {
        exposureRows = await fetchExposureRows(positions);
      } catch (error) {
        console.error("share-card exposure error", error);
      }
    }

    const countryExposure = computeCountryExposure(exposureRows);
    const topSectors = getTopSectors(exposureRows, 2);

    const subtitle = formatShareCardTickers(positions);

    const donutSegments = buildDonutSegments(positions);
    const legendEntries = buildLegendEntries(positions, 4);
    const topHoldings = getTopHoldings(exposureRows, 3);
    const holdingsRows =
      topHoldings.length > 0
        ? topHoldings
        : Array.from({ length: 3 }, () => ({
            label: "—",
            percent: 0,
          }));
    const hasExposure = exposureRows.length > 0;
    const regionLine = hasExposure
      ? `Region: US ${formatPercentValue(countryExposure.us)} · Canada ${formatPercentValue(countryExposure.canada)}`
      : "Region: –";
    const topSectorEntry = topSectors[0];
    const topSectorLine = topSectorEntry
      ? `Top Sector: ${topSectorEntry.sector} ${formatPercentValue(topSectorEntry.weightPct)}`
      : "Top Sector: –";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
            backgroundImage: "linear-gradient(#ffffff, #f7f7f5)",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            color: "#111827",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              padding: "56px 72px 40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "stretch",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                marginBottom: 32,
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>
                Your ETF Mix
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 400,
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                {subtitle}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 48,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: DONUT_SIZE,
                  height: DONUT_SIZE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  background: "radial-gradient(circle, #ffffff, #f3f4f6 75%)",
                  boxShadow: "0 16px 32px rgba(15,23,42,0.12)",
                }}
              >
                <svg
                  width={DONUT_SIZE}
                  height={DONUT_SIZE}
                  viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                >
                  <circle
                    cx={DONUT_CENTER}
                    cy={DONUT_CENTER}
                    r={DONUT_RADIUS}
                    stroke="#E5E7EB"
                    strokeWidth={DONUT_STROKE}
                    fill="none"
                  />

                  {donutSegments.map((segment, idx) => (
                    <circle
                      key={segment.label + idx}
                      cx={DONUT_CENTER}
                      cy={DONUT_CENTER}
                      r={DONUT_RADIUS}
                      stroke={segment.color}
                      strokeWidth={DONUT_STROKE}
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={segment.dashArray.join(" ")}
                      strokeDashoffset={segment.dashOffset}
                      transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
                    />
                  ))}
                </svg>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  fontSize: 22,
                  color: "#374151",
                }}
              >
                {legendEntries.map((entry) => (
                  <div
                    key={entry.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "9999px",
                        backgroundColor: entry.color,
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>{entry.label}</span>
                    <span style={{ color: "#6B7280", marginLeft: 6 }}>
                      {formatPercentValue(entry.weightPct)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 1,
                backgroundColor: "rgba(148,163,184,0.35)",
                marginBottom: 18,
              }}
            />

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 4 }}>
                Top 3 Holdings
              </div>
              {holdingsRows.map((holding, idx) => (
                <div
                  key={`${holding.label}-${idx}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 22,
                    color: "#111827",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{holding.label}</span>
                  <span style={{ color: "#4B5563" }}>
                    {holding.label === "—"
                      ? "No data"
                      : `${formatPercentValue(holding.percent)} of portfolio`}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 20,
                color: "#4B5563",
                marginBottom: 24,
              }}
            >
              <div>{regionLine}</div>
              <div>{topSectorLine}</div>
            </div>

            <div
              style={{
                fontSize: 18,
                color: "#9CA3AF",
                opacity: 0.7,
                textAlign: "center",
              }}
            >
              made with wizardfolio
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  } catch (error) {
    console.error("share-card route failed", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}

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
const DONUT_SIZE = 320;
const DONUT_RADIUS = 120;
const DONUT_STROKE = 24;
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
    const showFallbackDonut = donutSegments.length === 0;
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
            flexDirection: "column",
            alignItems: "center",
            padding: "68px 90px 56px",
            fontSize: 32,
            color: "#0F172A",
            backgroundImage: "linear-gradient(180deg, #FFFFFF 0%, #F7F7F5 100%)",
            fontFamily:
              "Inter, 'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 780,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
            <span
              style={{ fontSize: 40, fontWeight: 600, letterSpacing: "0.02em" }}
            >
              Your ETF Mix
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: "#475467",
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: 720,
              }}
            >
              {subtitle}
            </span>
          </div>

          <div
            style={{
              width: DONUT_SIZE,
              height: DONUT_SIZE,
              borderRadius: "50%",
              boxShadow: "0 14px 38px rgba(15, 23, 42, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 28,
            }}
          >
            <svg
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            >
              <defs>
                <radialGradient id="innerGradient">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="80%" stopColor="#F7F7F5" />
                </radialGradient>
                <radialGradient id="centerGlow">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="70%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
              </defs>
              <circle
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth={DONUT_STROKE}
                opacity={0.5}
              />
              {showFallbackDonut && (
                <circle
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke="#CBD5F5"
                  strokeWidth={DONUT_STROKE}
                  opacity={0.5}
                />
              )}
              {donutSegments.map((segment, idx) => (
                <circle
                  key={`${segment.color}-${idx}`}
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={segment.dashArray.join(" ")}
                  strokeDashoffset={segment.dashOffset}
                  transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
                />
              ))}
              <circle
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS - DONUT_STROKE}
                fill="url(#innerGradient)"
              />
              <circle
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS - DONUT_STROKE - 6}
                fill="url(#centerGlow)"
              />
            </svg>
          </div>

          {legendEntries.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
                justifyContent: "center",
                marginTop: 20,
                marginBottom: 26,
              }}
            >
              {legendEntries.map((segment) => (
                <div
                  key={segment.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 160,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: segment.color,
                      boxShadow: "0 0 6px rgba(15,23,42,0.08)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: "#0F172A",
                      }}
                    >
                      {segment.label}
                    </span>
                    <span
                      style={{
                        fontSize: 20,
                        color: "#6B7280",
                      }}
                    >
                      {formatPercentValue(segment.weightPct)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              width: "70%",
              height: 1,
              backgroundColor: "rgba(15,23,42,0.08)",
              display: "flex",
              margin: "4px 0 18px",
            }}
          />

          <div
            style={{
              width: "100%",
              maxWidth: 760,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: "#0F172A",
                letterSpacing: "0.02em",
              }}
            >
              Top 3 Holdings
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {holdingsRows.map((holding, idx) => (
                <div
                  key={`${holding.label}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 26,
                    lineHeight: 1.3,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      color:
                        holding.label === "—" ? "#9CA3AF" : "#0F172A",
                    }}
                  >
                    {holding.label}
                  </span>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 500,
                      color:
                        holding.label === "—" ? "#9CA3AF" : "#475467",
                    }}
                  >
                    {holding.label === "—"
                      ? "No data"
                      : `${formatPercentValue(holding.percent)} of portfolio`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 26,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 25,
              color: "#6B7280",
            }}
          >
            <span>{regionLine}</span>
            <span>{topSectorLine}</span>
          </div>
          </div>

          <div
            style={{
              marginTop: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 22,
                color: "rgba(107, 114, 128, 0.5)",
                fontWeight: 400,
                letterSpacing: "0.12em",
              }}
            >
              made with wizardfolio
            </span>
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

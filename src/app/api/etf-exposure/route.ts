import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { UserPosition } from "@/lib/exposureEngine";
import { normalizePositions } from "@/lib/positionsQuery";

const CACHE_HEADERS = { "Cache-Control": "no-store" };
const MAX_ETFS = 5;
const RPC_TIMEOUT_MS = 7000;

type EtfExposureRequest = {
  positions?: unknown;
};

type ExposureRow = {
  holding_symbol: string;
  holding_name: string;
  country: string | null;
  sector: string | null;
  asset_class: string | null;
  total_weight_pct: number;
};

type EtfExposureResponse = {
  exposure: ExposureRow[];
};

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const payload = (await req.json()) as EtfExposureRequest | null;

    if (!payload || !Array.isArray(payload.positions)) {
      return NextResponse.json(
        { error: "Payload must include a positions array" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const cleanedPositions: UserPosition[] = normalizePositions(
      payload.positions,
    );

    if (!cleanedPositions.length) {
      return NextResponse.json(
        {
          error:
            "At least one ETF with a non-empty symbol and positive weight is required",
        },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    if (cleanedPositions.length > MAX_ETFS) {
      return NextResponse.json(
        { error: "You can analyze up to 5 ETFs at a time." },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const etfs = cleanedPositions.map((item) => item.symbol);
    const weights = cleanedPositions.map((item) => item.weightPct);

    const supabase = getSupabaseAdminClient();

    try {
      const { data, error } = await supabase.rpc("calculate_exposure", {
        etfs,
        weights,
      });

      if (error) {
        console.error("[etf-exposure] Supabase RPC error", {
          message: error.message,
          code: error.code,
        });
        return NextResponse.json(
          { error: "Failed to calculate exposure", code: "RPC_FAILED" },
          { status: 502, headers: CACHE_HEADERS },
        );
      }

      const response: EtfExposureResponse = {
        exposure: (data ?? []) as ExposureRow[],
      };

      return NextResponse.json(response, {
        status: 200,
        headers: CACHE_HEADERS,
      });
    } catch (rpcError) {
      const err = rpcError as Error;
      if (err.message.includes("fetch failed") || err.message.includes("ECONNRESET")) {
        console.error("[etf-exposure] Network error", {
          message: err.message,
          name: err.name,
        });
        return NextResponse.json(
          { error: "Failed to load ETF exposure", code: "NETWORK_ERROR" },
          { status: 502, headers: CACHE_HEADERS },
        );
      }
      throw rpcError;
    }
  } catch (error) {
    const err = error as Error;
    if (err.message.includes("fetch failed") || err.message.includes("ECONNRESET")) {
      console.error("[etf-exposure] Network error", {
        message: err.message,
        name: err.name,
      });
      return NextResponse.json(
        { error: "Failed to load ETF exposure", code: "NETWORK_ERROR" },
        { status: 502, headers: CACHE_HEADERS },
      );
    }
    console.error("[etf-exposure] Unexpected error", {
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to load ETF exposure", code: "INTERNAL_ERROR" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}

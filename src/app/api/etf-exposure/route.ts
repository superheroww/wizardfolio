import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UserPosition } from "@/lib/exposureEngine";
import { normalizePositions } from "@/lib/positionsQuery";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase configuration is required for /api/etf-exposure");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const CACHE_HEADERS = { "Cache-Control": "no-store" };
const MAX_ETFS = 5;

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

    const { data, error } = await supabase.rpc("calculate_exposure", {
      etfs,
      weights,
    });

    if (error) {
      console.error("calculate_exposure error", error);
      return NextResponse.json(
        { error: "Internal error" },
        { status: 500, headers: CACHE_HEADERS },
      );
    }

    const response: EtfExposureResponse = {
      exposure: (data ?? []) as ExposureRow[],
    };

    return NextResponse.json(response, {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("ETF exposure handler failed", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}

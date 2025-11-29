import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
  etfs: string[];
  weights: number[];
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

const isNumberArray = (values: unknown[]): values is number[] =>
  values.every((value) => typeof value === "number" && Number.isFinite(value));

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const payload = (await req.json()) as Partial<EtfExposureRequest>;
    if (!payload || !Array.isArray(payload.etfs) || !Array.isArray(payload.weights)) {
      return NextResponse.json(
        { error: "Payload must include etfs and weights arrays" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    if (payload.etfs.length === 0) {
      return NextResponse.json(
        { error: "At least one ETF symbol is required" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    if (payload.etfs.length !== payload.weights.length) {
      return NextResponse.json(
        { error: "ETF symbols and weights must have the same length" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    if (payload.etfs.length > MAX_ETFS) {
      return NextResponse.json(
        { error: "You can analyze up to 5 ETFs at a time." },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    if (!isNumberArray(payload.weights)) {
      return NextResponse.json(
        { error: "Weights must be finite numbers" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const etfs = payload.etfs.map((symbol) =>
      typeof symbol === "string" ? symbol.trim() : "",
    );

    if (etfs.some((symbol) => symbol.length === 0)) {
      return NextResponse.json(
        { error: "ETF symbols must be non-empty strings" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    // FIXED: remove generic on rpc and cast the result explicitly
    const { data, error } = await supabase.rpc("calculate_exposure", {
      etfs,
      weights: payload.weights,
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

    return NextResponse.json(response, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error("ETF exposure handler failed", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { UserPosition } from "@/lib/exposureEngine";
import { normalizePositions } from "@/lib/positionsQuery";
import {
  MAX_POSITIONS_FOR_EXPOSURE,
  fetchExposureRows,
} from "@/lib/exposureService";

const CACHE_HEADERS = { "Cache-Control": "no-store" };

type EtfExposureRequest = {
  positions?: unknown;
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

    if (cleanedPositions.length > MAX_POSITIONS_FOR_EXPOSURE) {
      return NextResponse.json(
        { error: "You can analyze up to 5 ETFs at a time." },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const exposure = await fetchExposureRows(cleanedPositions);

    return NextResponse.json(
      { exposure },
      {
        status: 200,
        headers: CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error("ETF exposure handler failed", error);
    const message =
      error instanceof Error ? error.message : "Internal error";
    const exposeMessage =
      /ETF|analyze|weight/i.test(message) ||
      message ===
        "At least one ETF with a non-empty symbol and positive weight is required" ||
      message === "You can analyze up to 5 ETFs at a time.";
    const status = exposeMessage ? 400 : 500;
    return NextResponse.json(
      { error: exposeMessage ? message : "Internal error" },
      { status, headers: CACHE_HEADERS },
    );
  }
}

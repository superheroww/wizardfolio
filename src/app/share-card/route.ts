import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "Share card generation endpoint is not enabled yet.",
    },
    { status: 404 },
  );
}

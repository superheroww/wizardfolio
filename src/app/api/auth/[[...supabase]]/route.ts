import { NextResponse } from "next/server";

function handleAuthRoute() {
  return NextResponse.json(
    { ok: false, error: "Not implemented" },
    { status: 404 },
  );
}

export const GET = handleAuthRoute;
export const POST = handleAuthRoute;
export const PATCH = handleAuthRoute;
export const PUT = handleAuthRoute;
export const DELETE = handleAuthRoute;

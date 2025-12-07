import "server-only";

import type { ApiExposureRow, UserPosition } from "@/lib/exposureEngine";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const MAX_POSITIONS_FOR_EXPOSURE = 5;

export async function fetchExposureRows(
  positions: UserPosition[],
): Promise<ApiExposureRow[]> {
  if (!positions.length) {
    throw new Error(
      "At least one ETF with a non-empty symbol and positive weight is required",
    );
  }

  if (positions.length > MAX_POSITIONS_FOR_EXPOSURE) {
    throw new Error("You can analyze up to 5 ETFs at a time.");
  }

  const supabase = createServerSupabaseClient();

  const etfs = positions.map((item) => item.symbol);
  const weights = positions.map((item) => item.weightPct);

  const { data, error } = await supabase.rpc("calculate_exposure", {
    etfs,
    weights,
  });

  if (error) {
    console.error("calculate_exposure error", error);
    throw new Error("Unable to analyze your ETF mix right now.");
  }

  return (data ?? []) as ApiExposureRow[];
}

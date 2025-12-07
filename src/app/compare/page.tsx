import CompareLandingClient from "./CompareLandingClient";
import { CompareSavedMix } from "./types";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { normalizePositions } from "@/lib/positionsQuery";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  let savedMixes: CompareSavedMix[] = [];
  let isSignedIn = false;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    isSignedIn = Boolean(session?.user);

    if (isSignedIn) {
      const { data } = await supabase
        .from("saved_mixes")
        .select("id, name, positions, updated_at")
        .order("updated_at", { ascending: false });

      savedMixes = (data ?? []).map((mix) => ({
        id: mix.id,
        name: mix.name ?? "My mix",
        positions: normalizePositions(
          Array.isArray(mix.positions) ? mix.positions : [],
        ),
      }));
    }
  } catch (error) {
    console.error("Failed to prepare compare experience", error);
  }

  return (
    <CompareLandingClient
      isSignedIn={isSignedIn}
      savedMixes={savedMixes}
    />
  );
}

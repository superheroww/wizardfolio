import { UserPosition } from "@/lib/exposureEngine";

export type SavedMix = {
  id: string;
  user_id: string;
  name: string;
  positions: UserPosition[];
  created_at: string;
  updated_at: string;
};

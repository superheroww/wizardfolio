import { UserPosition } from "@/lib/exposureEngine";

export const DEFAULT_SAVED_MIX_NAME = "My saved mix";
export const SAVED_MIX_NAME_MAX_LENGTH = 60;
export const SAVED_MIX_NAME_ERROR_MESSAGE = `Name must be ${SAVED_MIX_NAME_MAX_LENGTH} characters or fewer.`;
export const SAVED_MIX_NAME_REQUIRED_MESSAGE =
  "Name must include at least one non-space character.";

export type SavedMix = {
  id: string;
  user_id: string;
  name: string;
  positions: UserPosition[];
  created_at: string;
  updated_at: string;
};

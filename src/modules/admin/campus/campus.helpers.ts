import { parseRecord } from "../../../services/api.service";
import type { INestedJsonApi } from "./types";

export const unwrapNested = <T extends object>(
  value?: INestedJsonApi<T> | null,
): (T & { id: string }) | null => {
  if (!value) return null;
  return parseRecord<T>(value);
};

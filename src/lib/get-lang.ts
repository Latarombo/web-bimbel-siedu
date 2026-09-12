import { cookies } from "next/headers";
import { type Lang } from "./i18n";

/** Server-only: bahasa aktif dari cookie `lang` — default Indonesia. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("lang")?.value === "en" ? "en" : "id";
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** cn — gabung className + resolusi konflik Tailwind (konvensi shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

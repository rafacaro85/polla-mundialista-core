import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeJSONParse<T>(value: string | null): T | null {
  if (!value || value === "undefined") return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error("Error parsing JSON from localStorage", e);
    return null;
  }
}

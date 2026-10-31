// Turns any thrown value into one sentence a beginner-run business owner can act on.
import { ApiError } from "@/lib/api";

interface ValidationItem {
  msg?: string;
  loc?: (string | number)[];
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as { detail?: unknown } | null | undefined;
    const detail = body?.detail;

    if (Array.isArray(detail)) {
      const first = detail[0] as ValidationItem | undefined;
      if (first?.msg) {
        // Pydantic prefixes custom validator messages with "Value error, ".
        return String(first.msg).replace(/^Value error,\s*/, "");
      }
    }
    if (typeof detail === "string" && detail.trim()) return detail;
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status >= 500) return "Something went wrong on our end. Please try again.";
    return "The request was rejected. Please check the details and try again.";
  }
  return "No connection to the server. Please check your internet connection and try again.";
}

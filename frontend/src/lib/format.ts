// Small date/time helpers. Pod data is stored as aware UTC ISO strings.
import { INACTIVE_STATUSES } from "@/lib/types";
import type { Lead } from "@/lib/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (value: number) => String(value).padStart(2, "0");

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "24 Oct 2026, 04:30 PM" */
export function formatDateTime(iso: string | null | undefined): string {
  const date = parse(iso);
  if (!date) return "—";
  const hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(
    hour12,
  )}:${pad(date.getMinutes())} ${suffix}`;
}

/** e.g. "15m ago", "3h ago", "2d ago" */
export function relativeTime(iso: string | null | undefined): string {
  const date = parse(iso);
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** When is this follow-up, and does it need attention right now? */
export function followUpState(lead: Lead): {
  active: boolean;
  overdue: boolean;
  text: string;
} {
  const inactive = INACTIVE_STATUSES.includes(lead.status);
  const date = parse(lead.follow_up_at);

  if (inactive) {
    return {
      active: false,
      overdue: false,
      text: lead.status === "Booked" ? "Booked — no follow-up needed" : "Closed — no follow-up needed",
    };
  }
  if (!date) {
    return lead.status === "Follow-up Due"
      ? { active: true, overdue: true, text: "Due now — no time set" }
      : { active: false, overdue: false, text: "No follow-up scheduled" };
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs >= 0) {
    const minutes = Math.floor(diffMs / 60_000);
    const label =
      minutes < 60
        ? `${Math.max(minutes, 1)}m`
        : minutes < 1440
          ? `${Math.floor(minutes / 60)}h`
          : `${Math.floor(minutes / 1440)}d`;
    return { active: true, overdue: true, text: `Overdue by ${label} — ${formatDateTime(lead.follow_up_at)}` };
  }
  return { active: true, overdue: false, text: `Follow up ${formatDateTime(lead.follow_up_at)}` };
}

/** Value for an <input type="datetime-local">, in the browser's local time. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  const date = parse(iso);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** ISO string for a quick follow-up preset (hours from now). */
export function isoFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

/** ISO string for tomorrow at 10:00 local time. */
export function isoTomorrowMorning(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

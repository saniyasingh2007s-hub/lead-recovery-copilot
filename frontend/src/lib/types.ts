// Hand-written mirrors of the Pydantic models in backend/models/*.py.
// Nothing infers across the HTTP boundary — keep each pair in sync by hand.

export type LeadStatus =
  | "New"
  | "Acknowledgement Sent"
  | "Follow-up Due"
  | "Booked"
  | "Closed";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Acknowledgement Sent",
  "Follow-up Due",
  "Booked",
  "Closed",
];

// Leads in these states are never an active follow-up again.
export const INACTIVE_STATUSES: LeadStatus[] = ["Booked", "Closed"];

export interface Lead {
  id: string;
  name: string;
  contact: string;
  service: string;
  message: string;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}

export interface LeadCreate {
  name: string;
  contact: string;
  service: string;
  message: string;
}

export interface LeadUpdate {
  status?: LeadStatus | null;
  follow_up_at?: string | null;
  clear_follow_up?: boolean;
}

export interface LeadStats {
  total: number;
  new: number;
  followups_due: number;
  booked: number;
}

export interface Reminders {
  overdue: Lead[];
  upcoming: Lead[];
}

export interface SeedResult {
  inserted: number;
  deleted: number;
}

export interface Business {
  id: string;
  name: string;
  tagline: string;
  services: string[];
}

export interface BusinessUpdate {
  name: string;
  tagline: string;
  services: string[];
}

export interface Owner {
  id: string;
  email: string;
}

export interface SessionInfo {
  authenticated: boolean;
  owner: Owner | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Shared query keys + mutations for leads, reminders and the business profile.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { Business, BusinessUpdate, Lead, LeadStats, LeadUpdate, Reminders, SeedResult } from "@/lib/types";

export const LEADS_KEY = ["leads"];
export const LEAD_STATS_KEY = ["lead-stats"];
export const REMINDERS_KEY = ["reminders"];
export const BUSINESS_KEY = ["business"];

export const fetchLeads = (status: string, search: string) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (search.trim()) params.set("q", search.trim());
  const query = params.toString();
  return apiGet<Lead[]>(`/leads${query ? `?${query}` : ""}`);
};

export const fetchLeadStats = () => apiGet<LeadStats>("/leads/stats");
export const fetchReminders = () => apiGet<Reminders>("/leads/reminders");
export const fetchBusiness = () => apiGet<Business>("/business");

function invalidateLeadQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: LEADS_KEY });
  queryClient.invalidateQueries({ queryKey: LEAD_STATS_KEY });
  queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeadUpdate }) =>
      apiPatch<Lead>(`/leads/${id}`, payload),
    onSuccess: (lead) => {
      invalidateLeadQueries(queryClient);
      toast.success(`Saved — ${lead.name.split(" - ").pop()} is now "${lead.status}".`);
    },
    onError: () => toast.error("Could not update the lead. Please try again."),
  });
}

export function useSeedDemoLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<SeedResult>("/leads/demo/seed"),
    onSuccess: (result) => {
      invalidateLeadQueries(queryClient);
      toast.success(`Loaded ${result.inserted} labelled demo leads.`);
    },
    onError: () => toast.error("Could not load the demo leads."),
  });
}

export function useClearDemoLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<SeedResult>("/leads/demo"),
    onSuccess: (result) => {
      invalidateLeadQueries(queryClient);
      toast.success(`Removed ${result.deleted} demo leads. Real enquiries were kept.`);
    },
    onError: () => toast.error("Could not remove the demo leads."),
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessUpdate) => apiPut<Business>("/business", payload),
    onSuccess: (business) => {
      queryClient.setQueryData(BUSINESS_KEY, business);
      toast.success(`Saved — the enquiry form now says "${business.name}".`);
    },
    onError: () => toast.error("Could not save the business profile."),
  });
}

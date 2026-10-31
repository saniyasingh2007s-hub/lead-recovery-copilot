// Session boundary: auth is an httpOnly cookie the backend owns; the frontend's one
// duty at a session edge is wiping the react-query cache so one account's data never
// renders for the next, and asking "who am I" through GET /api/auth/me.
import { useQuery } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { Owner, SessionInfo } from "@/lib/types";

export const SESSION_KEY = ["session"];

export const fetchSession = () => apiGet<SessionInfo>("/auth/me");

export function useSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    retry: false,
    staleTime: 15_000,
  });

  const owner: Owner | null = query.data?.authenticated ? (query.data.owner ?? null) : null;
  return {
    owner,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

/** Call after every successful login. */
export async function beginSession(): Promise<void> {
  queryClient.clear();
  await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
}

/** Every sign-out control must await this. */
export async function endSession(): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } finally {
    queryClient.clear();
  }
}

import { supabase } from "./supabase";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Could not read the authentication session: ${error.message}`);
  }
  if (!data.session?.access_token) {
    throw new Error("Please sign in again to continue.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `The request failed (${response.status}).`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

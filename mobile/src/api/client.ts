// mobile/src/api/client.ts
//
// Thin fetch wrapper over BWE's real API -- every mobile screen calls
// through this, never a mock/local fixture. Attaches the Bearer token
// (Phase 7 -- getNetworkSession in the web app's
// src/lib/network/shared.ts accepts this exact header) when present.

import { getStoredToken } from "../storage/session";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const token = await getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await res.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        parsed?.error?.message ||
        parsed?.error ||
        parsed?.message ||
        `Request failed (${res.status})`;
      return { ok: false, status: res.status, error: message };
    }
    return { ok: true, status: res.status, data: parsed as T };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

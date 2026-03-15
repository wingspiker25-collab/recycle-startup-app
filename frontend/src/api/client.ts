const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://recycle-startup-app.onrender.com") + "/api";
export async function api<T>(
  path: string,
  opts: RequestInit & { skipJson?: boolean } = {}
): Promise<{ data?: T; error?: string }> {
  const { skipJson, ...fetchOpts } = opts;
  const token = localStorage.getItem("recycle_auth")
    ? JSON.parse(localStorage.getItem("recycle_auth")!).token
    : null;

  const headers: Record<string, string> = {
    ...(fetchOpts.headers as Record<string, string>),
  };
  if (!(fetchOpts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...fetchOpts, headers } as RequestInit);
  if (skipJson) return res.ok ? { data: undefined } as { data?: T } : { error: res.statusText };

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || res.statusText || "Request failed" };
  return { data: json };
}

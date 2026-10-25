// fetch with per-attempt timeout and retry — the sandbox occasionally
// fails outbound connections with ETIMEDOUT (IPv6/IPv4 happy-eyeballs flakiness),
// so a short retry loop makes upstream calls reliable.
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: { retries?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const { retries = 3, timeoutMs = 10_000 } = opts;
  let lastErr: unknown = new Error("fetch failed");
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

// Ad-hoc per-IP rate limiter backed by Cloudflare D1 with in-memory fallback.
// Sliding window: max N hits per WINDOW_SECONDS.
import { getDB } from "./requests-db.server";

const WINDOW_SECONDS = 60 * 60; // 1 hour
const MAX_HITS = 5;
const CLEANUP_OLDER_THAN = 60 * 60 * 24; // 24h

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

// In-memory rate limiting store for local development/preview
const memoryHits = new Map<string, number[]>();

export async function checkAndRecord(ip: string): Promise<RateLimitResult> {
  if (!ip) return { ok: true, remaining: MAX_HITS };
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const since = now - WINDOW_SECONDS;

  if (db) {
    try {
      const row = await db
        .prepare(
          "SELECT COUNT(*) AS c, MIN(created_at) AS first FROM request_hits WHERE ip = ? AND created_at >= ?",
        )
        .bind(ip, since)
        .first<{ c: number; first: number | null }>();

      const count = row?.c ?? 0;
      if (count >= MAX_HITS) {
        const first = row?.first ?? now;
        return { ok: false, retryAfterSeconds: Math.max(1, first + WINDOW_SECONDS - now) };
      }

      await db
        .prepare("INSERT INTO request_hits (ip, created_at) VALUES (?, ?)")
        .bind(ip, now)
        .run();

      // Opportunistic cleanup — cheap, keeps table tiny.
      await db
        .prepare("DELETE FROM request_hits WHERE created_at < ?")
        .bind(now - CLEANUP_OLDER_THAN)
        .run();

      return { ok: true, remaining: MAX_HITS - count - 1 };
    } catch (err) {
      console.warn("[D1 Rate Limit] D1 check failed, using memory fallback:", err);
    }
  }

  // In-memory rate limiter fallback
  const hits = (memoryHits.get(ip) ?? []).filter((timestamp) => timestamp >= since);
  if (hits.length >= MAX_HITS) {
    const first = hits[0] ?? now;
    return { ok: false, retryAfterSeconds: Math.max(1, first + WINDOW_SECONDS - now) };
  }

  hits.push(now);
  memoryHits.set(ip, hits);

  return { ok: true, remaining: MAX_HITS - hits.length };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
  );
}

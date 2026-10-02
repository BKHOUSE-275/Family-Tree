import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, isDatabaseConfigured } from "@/lib/db";

// Fixed-window counters shared by every server instance (Neon), with an
// in-memory fallback for local development without a database.

declare global {
  var __rateLimitMemory: Map<string, { count: number; windowStart: number }> | undefined;
}

let rateLimitTableReady: Promise<void> | null = null;

function ensureRateLimitTable() {
  rateLimitTableReady ??= getDb()
    .execute(sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        window_start TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    .then(() => undefined)
    .catch((error) => {
      rateLimitTableReady = null;
      throw error;
    });
  return rateLimitTableReady;
}

function hitMemory(key: string, windowSeconds: number) {
  const memory = (globalThis.__rateLimitMemory ??= new Map());
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now - entry.windowStart > windowSeconds * 1000) {
    memory.set(key, { count: 1, windowStart: now });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

/**
 * Records one attempt for `key` and returns true while the caller is still
 * within `limit` attempts per `windowSeconds`. Fails open if the counter
 * store is unreachable, so an outage never locks the family out.
 */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number) {
  if (!isDatabaseConfigured()) {
    return hitMemory(key, windowSeconds) <= limit;
  }
  try {
    await ensureRateLimitTable();
    const result = await getDb().execute(sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE
          WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          THEN now() ELSE rate_limits.window_start END
      RETURNING count
    `);
    const count = Number((result.rows[0] as { count?: unknown } | undefined)?.count ?? 0);
    return count <= limit;
  } catch (error) {
    console.error("Rate limit check failed", error);
    return true;
  }
}

/** Clears a counter, e.g. after a successful sign-in. */
export async function resetRateLimit(key: string) {
  if (!isDatabaseConfigured()) {
    globalThis.__rateLimitMemory?.delete(key);
    return;
  }
  try {
    await ensureRateLimitTable();
    await getDb().execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
  } catch (error) {
    console.error("Rate limit reset failed", error);
  }
}

/** Best-effort client address for keying limits (Vercel sets x-forwarded-for). */
export async function clientIp() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip") || "unknown";
}

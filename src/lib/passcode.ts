import { createHash, timingSafeEqual } from "crypto";
import { clientIp, hitRateLimit, resetRateLimit } from "@/lib/rate-limit";

const ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;

/** Constant-time string comparison (hashing first evens out the lengths). */
export function secretsMatch(provided: string, expected: string) {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Checks the shared super-admin passcode, limiting guesses per client and per
 * email so it cannot be brute-forced. Returns an error message, or null.
 */
export async function checkGatePasscode(password: string, email: string) {
  const expected = (process.env.FAMILY_GATE_PASSWORD ?? "").trim();
  if (!expected) {
    return "FAMILY_GATE_PASSWORD is not loaded. Save .env and restart npm run dev.";
  }

  const ipKey = `passcode:ip:${await clientIp()}`;
  const emailKey = `passcode:email:${email}`;
  const [ipAllowed, emailAllowed] = await Promise.all([
    hitRateLimit(ipKey, ATTEMPTS, WINDOW_SECONDS),
    hitRateLimit(emailKey, ATTEMPTS, WINDOW_SECONDS),
  ]);
  if (!ipAllowed || !emailAllowed) {
    return "Too many passcode attempts. Wait 15 minutes and try again.";
  }

  if (!secretsMatch(password, expected)) {
    return "That passcode is not right.";
  }
  await Promise.all([resetRateLimit(ipKey), resetRateLimit(emailKey)]);
  return null;
}

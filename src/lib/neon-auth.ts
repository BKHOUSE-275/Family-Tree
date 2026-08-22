import { createNeonAuth } from "@neondatabase/auth/next/server";
import { isNeonAuthConfigured } from "@/lib/auth-constants";

let neonAuth: ReturnType<typeof createNeonAuth> | null = null;

export function getNeonAuth() {
  if (!isNeonAuthConfigured()) {
    throw new Error("Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.");
  }
  if (!neonAuth) {
    neonAuth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    });
  }
  return neonAuth;
}

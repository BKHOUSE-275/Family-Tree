import { cookies, headers } from "next/headers";
import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import {
  createAuthServer,
  extractNeonAuthCookies,
  type CookieOptions,
} from "@neondatabase/auth/server";
import { isNeonAuthConfigured } from "@/lib/auth-constants";

let neonAuth: NeonAuth | null = null;

function isCookieMutationDenied(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified in a Server Action or Route Handler")
  );
}

async function createRequestContext() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return {
    getCookies() {
      return extractNeonAuthCookies(headerStore.get("cookie") ?? "");
    },
    setCookie(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set(name, value, options);
      } catch (error) {
        // getSession() may mint/refresh cookies. Next.js only allows that in
        // Server Actions, Route Handlers, and middleware — not RSC renders.
        if (isCookieMutationDenied(error)) return;
        throw error;
      }
    },
    getHeader(name: string) {
      return headerStore.get(name) ?? null;
    },
    getOrigin() {
      return (
        headerStore.get("origin") ||
        headerStore.get("referer")?.split("/").slice(0, 3).join("/") ||
        ""
      );
    },
    getFramework() {
      return "nextjs";
    },
  };
}

export function getNeonAuth() {
  if (!isNeonAuthConfigured()) {
    throw new Error("Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.");
  }
  if (!neonAuth) {
    const config = {
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    };
    const nextAuth = createNeonAuth(config);
    const server = createAuthServer({
      baseUrl: config.baseUrl,
      context: createRequestContext,
      cookieSecret: config.cookies.secret,
    });
    neonAuth = Object.assign(server, {
      handler: nextAuth.handler.bind(nextAuth),
      middleware: nextAuth.middleware.bind(nextAuth),
    });
  }
  return neonAuth;
}

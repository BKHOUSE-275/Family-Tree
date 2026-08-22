import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCAL_AUTH_COOKIE, isNeonAuthConfigured } from "@/lib/auth-constants";
import { getNeonAuth } from "@/lib/neon-auth";

const PROTECTED = [/^\/tree(?:\/|$)/, /^\/admin(?:\/|$)/, /^\/profile(?:\/|$)/];

function isProtected(pathname: string) {
  return PROTECTED.some((pattern) => pattern.test(pathname));
}

export default function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (isNeonAuthConfigured()) {
    return getNeonAuth().middleware({ loginUrl: "/sign-in" })(request);
  }

  if (request.cookies.get(LOCAL_AUTH_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  const signIn = request.nextUrl.clone();
  signIn.pathname = "/sign-in";
  signIn.searchParams.set("redirect_url", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/tree",
    "/tree/:path*",
    "/admin",
    "/admin/:path*",
    "/profile",
    "/profile/:path*",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCAL_AUTH_COOKIE, isNeonAuthConfigured } from "@/lib/auth-constants";
import { COMMITTEE_SESSION_COOKIE, readCommitteeSessionToken } from "@/lib/committee-session";
import { getNeonAuth } from "@/lib/neon-auth";

const ADMIN = /^\/admin(?:\/|$)/;
const PROFILE = /^\/profile(?:\/|$)/;

function signInRedirect(request: NextRequest) {
  const signIn = request.nextUrl.clone();
  signIn.pathname = "/sign-in";
  signIn.searchParams.set("redirect_url", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = ADMIN.test(pathname);
  const isProfile = PROFILE.test(pathname);
  if (!isAdmin && !isProfile) {
    return NextResponse.next();
  }

  const committee = await readCommitteeSessionToken(
    request.cookies.get(COMMITTEE_SESSION_COOKIE)?.value,
  );
  if (committee) {
    return NextResponse.next();
  }

  if (isAdmin) {
    return signInRedirect(request);
  }

  if (isNeonAuthConfigured()) {
    return getNeonAuth().middleware({ loginUrl: "/sign-in" })(request);
  }

  if (request.cookies.get(LOCAL_AUTH_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  return signInRedirect(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/profile", "/profile/:path*"],
};

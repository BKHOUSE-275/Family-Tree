"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LOCAL_AUTH_COOKIE,
  LOCAL_USER_ID,
  isNeonAuthConfigured,
} from "@/lib/auth-constants";
import { getNeonAuth } from "@/lib/neon-auth";
import { committeeHomePath, getAppUser } from "@/lib/auth";
import {
  COMMITTEE_SESSION_COOKIE,
  committeeSessionCookieOptions,
  createCommitteeSessionToken,
  expiredCommitteeSessionCookieOptions,
} from "@/lib/committee-session";
import { recordAudit } from "@/lib/audit";
import {
  findPendingInvite,
  findProfileByEmail,
  saveCommitteeInvite,
  upsertProfile,
} from "@/lib/store";
import { defaultAdminPermissions, isCommittee, type Profile } from "@/lib/types";

function safeRedirect(value: FormDataEntryValue | null) {
  const next = String(value ?? "/admin");
  return next.startsWith("/") ? next : "/admin";
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function committeeUserId(email: string, existing?: Profile | null) {
  return existing?.userId ?? `email:${email}`;
}

async function setCommitteeCookie(email: string, userId: string) {
  const token = await createCommitteeSessionToken({ email, userId });
  const store = await cookies();
  store.set(COMMITTEE_SESSION_COOKIE, token, committeeSessionCookieOptions());
}

async function issueCommitteeSession(profile: Profile, redirectUrl: string) {
  await setCommitteeCookie(profile.email ?? "", profile.userId);
  const user = {
    id: profile.userId,
    email: profile.email,
    name: profile.email,
    role: profile.role,
    personId: profile.personId,
    permissions: profile.permissions,
    isLocal: false,
  };
  const fallback = committeeHomePath(user);
  const next =
    redirectUrl === "/admin" || redirectUrl.startsWith("/admin") ? redirectUrl : fallback;
  return isCommittee(profile.role) ? next : fallback;
}

function signInUrl(input: {
  redirectUrl: string;
  email?: string;
  step?: "passcode";
  error?: string;
}) {
  const params = new URLSearchParams();
  params.set("redirect_url", input.redirectUrl);
  if (input.email) params.set("email", input.email);
  if (input.step) params.set("step", input.step);
  if (input.error) params.set("error", input.error);
  return `/sign-in?${params.toString()}`;
}

async function openCommitteeDesk(profile: Profile, redirectUrl: string): Promise<never> {
  const next = await issueCommitteeSession(profile, redirectUrl);
  redirect(next);
}

export type CommitteeEmailState = {
  error?: string;
  step?: "passcode";
  email?: string;
  next?: string;
} | null;

export async function lookupCommitteeEmail(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const redirectUrl = safeRedirect(formData.get("redirect_url"));
  if (!email || !email.includes("@")) {
    redirect(signInUrl({ redirectUrl, error: "Enter a committee email address." }));
  }

  let existing;
  let invite;
  try {
    existing = await findProfileByEmail(email);
    invite = await findPendingInvite(email);
  } catch (error) {
    console.error("Committee email lookup failed", error);
    redirect(
      signInUrl({
        redirectUrl,
        email,
        error: "Could not reach the committee list. Try again.",
      }),
    );
  }

  if (existing?.role === "super_admin") {
    redirect(signInUrl({ redirectUrl, email, step: "passcode" }));
  }

  if (existing && isCommittee(existing.role)) {
    await openCommitteeDesk(existing, redirectUrl);
  }

  if (invite) {
    const profile: Profile = {
      userId: committeeUserId(email, existing),
      personId: existing?.personId ?? null,
      role: "admin",
      email,
      permissions: existing?.permissions ?? defaultAdminPermissions(),
    };
    await upsertProfile(profile);
    await saveCommitteeInvite({
      ...invite,
      usedAt: new Date().toISOString(),
    });
    await recordAudit(
      { id: profile.userId, email },
      "role.change",
      email,
      "Accepted an admin invite",
      profile.userId,
    );
    await openCommitteeDesk(profile, redirectUrl);
  }

  redirect(
    signInUrl({
      redirectUrl,
      email,
      error: "That email is not on the committee.",
    }),
  );
}

export async function signInSuperAdminPasscode(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "").trim();
  const redirectUrl = safeRedirect(formData.get("redirect_url"));
  const expected = (process.env.FAMILY_GATE_PASSWORD ?? "").trim();
  const passcodeUrl = (error: string) =>
    signInUrl({ redirectUrl, email, step: "passcode", error });

  let existing;
  try {
    existing = await findProfileByEmail(email);
  } catch (error) {
    console.error("Super admin sign-in failed", error);
    redirect(passcodeUrl("Could not open the committee desk. Try again."));
  }

  const allowed = existing?.role === "super_admin";
  if (!email || !allowed) {
    redirect(passcodeUrl("That email is not a super admin."));
  }
  if (!expected) {
    redirect(
      passcodeUrl("FAMILY_GATE_PASSWORD is not loaded. Save .env and restart npm run dev."),
    );
  }
  if (password !== expected) {
    redirect(passcodeUrl("That passcode is not right."));
  }

  const profile: Profile = {
    userId: committeeUserId(email, existing),
    personId: existing?.personId ?? null,
    role: "super_admin",
    email,
    permissions: defaultAdminPermissions(),
  };
  await upsertProfile(profile);
  await openCommitteeDesk(profile, redirectUrl);
}

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
) {
  if (!isNeonAuthConfigured()) {
    return { error: "Neon Auth is not connected yet." };
  }
  const { error } = await getNeonAuth().signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    return { error: error.message || "Could not sign in. Try again." };
  }
  redirect(safeRedirect(formData.get("redirect_url")));
}

export async function signUpWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
) {
  if (!isNeonAuthConfigured()) {
    return { error: "Neon Auth is not connected yet." };
  }

  const invite = process.env.FAMILY_INVITE_CODE ?? "";
  const provided = String(formData.get("inviteCode") ?? "").trim();
  if (invite) {
    if (provided !== invite) {
      return { error: "That family invite code is not right." };
    }
  } else if (process.env.NODE_ENV === "production") {
    return { error: "Set FAMILY_INVITE_CODE before inviting family." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await getNeonAuth().signUp.email({
    email,
    name: name || email,
    password,
  });
  if (error) {
    return { error: error.message || "Could not create the account." };
  }
  redirect("/admin");
}

export async function signInLocal(formData: FormData) {
  if (isNeonAuthConfigured()) {
    throw new Error("Use your family email to sign in.");
  }

  const password = String(formData.get("password") ?? "");
  const expected = process.env.FAMILY_GATE_PASSWORD ?? "";
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !expected) {
    throw new Error(
      "Set FAMILY_GATE_PASSWORD or connect Neon Auth before inviting family.",
    );
  }
  if (expected && password !== expected) {
    throw new Error("That family password is not right.");
  }

  await upsertProfile({
    userId: LOCAL_USER_ID,
    personId: null,
    role: "super_admin",
    email: null,
    permissions: defaultAdminPermissions(),
  });

  const store = await cookies();
  store.set(LOCAL_AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(safeRedirect(formData.get("redirect_url")));
}

export async function signOutAction() {
  const store = await cookies();
  store.set(COMMITTEE_SESSION_COOKIE, "", expiredCommitteeSessionCookieOptions());
  store.set(LOCAL_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  store.delete({ name: COMMITTEE_SESSION_COOKIE, path: "/" });
  store.delete({ name: LOCAL_AUTH_COOKIE, path: "/" });
  try {
    if (isNeonAuthConfigured()) {
      await getNeonAuth().signOut();
    }
  } catch (error) {
    console.error("Could not end the Neon session", error);
  }
  redirect("/");
}

export async function currentCommitteeHome() {
  const user = await getAppUser();
  return user ? committeeHomePath(user) : "/sign-in";
}

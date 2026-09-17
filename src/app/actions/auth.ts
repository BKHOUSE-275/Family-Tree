"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LOCAL_AUTH_COOKIE,
  LOCAL_USER_ID,
  committeeAllowlist,
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

function isEnvSuper(email: string) {
  return committeeAllowlist().includes(email);
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

export type CommitteeEmailState = {
  error?: string;
  step?: "passcode";
  email?: string;
  next?: string;
} | null;

export async function lookupCommitteeEmail(
  _prev: CommitteeEmailState,
  formData: FormData,
): Promise<CommitteeEmailState> {
  const email = normalizeEmail(formData.get("email"));
  const redirectUrl = safeRedirect(formData.get("redirect_url"));
  if (!email || !email.includes("@")) {
    return { error: "Enter a committee email address." };
  }

  const existing = await findProfileByEmail(email);
  const invite = await findPendingInvite(email);
  const envSuper = isEnvSuper(email);
  const storedSuper = existing?.role === "super_admin";

  if (envSuper || storedSuper) {
    return { step: "passcode", email };
  }

  if (existing && isCommittee(existing.role)) {
    return { next: await issueCommitteeSession(existing, redirectUrl) };
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
    return { next: await issueCommitteeSession(profile, redirectUrl) };
  }

  return { error: "That email is not on the committee." };
}

export async function signInSuperAdminPasscode(
  _prev: CommitteeEmailState,
  formData: FormData,
): Promise<CommitteeEmailState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "").trim();
  const redirectUrl = safeRedirect(formData.get("redirect_url"));
  const expected = (process.env.FAMILY_GATE_PASSWORD ?? "").trim();
  const existing = await findProfileByEmail(email);
  const allowed = isEnvSuper(email) || existing?.role === "super_admin";

  if (!email || !allowed) {
    return { error: "That email is not a super admin.", step: "passcode", email };
  }
  if (!expected) {
    return {
      error: "FAMILY_GATE_PASSWORD is not loaded. Save .env and restart npm run dev.",
      step: "passcode",
      email,
    };
  }
  if (password !== expected) {
    return { error: "That passcode is not right.", step: "passcode", email };
  }

  const profile: Profile = {
    userId: committeeUserId(email, existing),
    personId: existing?.personId ?? null,
    role: "super_admin",
    email,
    permissions: defaultAdminPermissions(),
  };
  await upsertProfile(profile);
  return { next: await issueCommitteeSession(profile, redirectUrl) };
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

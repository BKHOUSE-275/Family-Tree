"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LOCAL_AUTH_COOKIE,
  LOCAL_USER_ID,
  isNeonAuthConfigured,
} from "@/lib/auth-constants";
import { getNeonAuth } from "@/lib/neon-auth";
import { upsertProfile } from "@/lib/store";

function safeRedirect(value: FormDataEntryValue | null) {
  const next = String(value ?? "/tree");
  return next.startsWith("/") ? next : "/tree";
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
  redirect("/tree");
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
    role: "admin",
    email: null,
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
  if (isNeonAuthConfigured()) {
    await getNeonAuth().signOut();
  }
  const store = await cookies();
  store.delete(LOCAL_AUTH_COOKIE);
  redirect("/");
}

import { cookies } from "next/headers";
import { getProfile, getSnapshot, upsertProfile } from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  LOCAL_AUTH_COOKIE,
  LOCAL_USER_ID,
  isNeonAuthConfigured,
} from "@/lib/auth-constants";
import { getNeonAuth } from "@/lib/neon-auth";

export { LOCAL_AUTH_COOKIE, LOCAL_USER_ID, isNeonAuthConfigured };

export type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
  personId: string | null;
  isLocal: boolean;
};

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAppUser(): Promise<AppUser | null> {
  if (isNeonAuthConfigured()) {
    const { data: session } = await getNeonAuth().getSession();
    const user = session?.user;
    if (!user) return null;
    const email = user.email ?? null;
    let profile = await getProfile(user.id);
    const existingProfiles = (await getSnapshot()).profiles;
    const firstLogin = !profile && existingProfiles.length === 0;
    const shouldBeAdmin =
      firstLogin ||
      Boolean(email && adminEmails().includes(email.toLowerCase())) ||
      profile?.role === "admin";
    if (!profile) {
      profile = {
        userId: user.id,
        personId: null,
        role: shouldBeAdmin ? "admin" : "member",
        email,
      };
      try {
        await upsertProfile(profile);
      } catch (error) {
        console.error("Could not save family profile", error);
      }
    } else {
      const next = {
        ...profile,
        email: email ?? profile.email,
        role: shouldBeAdmin ? ("admin" as const) : profile.role,
      };
      if (next.email !== profile.email || next.role !== profile.role) {
        await upsertProfile(next);
      }
      profile = next;
    }
    return {
      id: user.id,
      email,
      name: user.name ?? null,
      role: profile.role,
      personId: profile.personId,
      isLocal: false,
    };
  }

  const store = await cookies();
  if (store.get(LOCAL_AUTH_COOKIE)?.value !== "1") return null;
  const profile = await getProfile(LOCAL_USER_ID);
  return {
    id: LOCAL_USER_ID,
    email: profile?.email ?? null,
    name: "Family editor",
    role: profile?.role ?? "admin",
    personId: profile?.personId ?? null,
    isLocal: true,
  };
}

export async function requireUser() {
  const user = await getAppUser();
  if (!user) {
    throw new Error("Sign in to continue.");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Only family admins can do that.");
  }
  return user;
}

export function canEditPerson(user: AppUser, personId: string) {
  return user.role === "admin" || user.personId === personId;
}

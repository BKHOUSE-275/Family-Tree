import { cookies } from "next/headers";
import { findPendingInvite, getProfile, saveCommitteeInvite, upsertProfile } from "@/lib/store";
import { isCommittee, type Role } from "@/lib/types";
import {
  LOCAL_AUTH_COOKIE,
  LOCAL_USER_ID,
  committeeAllowlist,
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

function isAllowlisted(email: string | null) {
  return Boolean(email && committeeAllowlist().includes(email.toLowerCase()));
}

export async function getAppUser(): Promise<AppUser | null> {
  if (isNeonAuthConfigured()) {
    const { data: session } = await getNeonAuth().getSession();
    const user = session?.user;
    if (!user) return null;
    const email = user.email ?? null;
    let profile = await getProfile(user.id);
    let role: Role = profile?.role ?? "member";

    if (isAllowlisted(email)) {
      role = "super_admin";
    } else if (email && role === "member") {
      const invite = await findPendingInvite(email);
      if (invite) {
        role = "admin";
        await saveCommitteeInvite({
          ...invite,
          usedAt: new Date().toISOString(),
        });
      }
    }

    if (!profile) {
      profile = {
        userId: user.id,
        personId: null,
        role,
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
        role,
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
    role: profile?.role ?? "super_admin",
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
  if (!isCommittee(user.role)) {
    throw new Error("Only family admins can do that.");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (user.role !== "super_admin") {
    throw new Error("Only a super admin can manage committee permissions.");
  }
  return user;
}

export function canEditPerson(user: AppUser) {
  return isCommittee(user.role);
}

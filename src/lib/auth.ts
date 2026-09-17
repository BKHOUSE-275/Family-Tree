import { cookies } from "next/headers";
import {
  findProfileByEmail,
  getProfile,
} from "@/lib/store";
import {
  defaultAdminPermissions,
  hasPermission,
  isCommittee,
  parseAdminPermissions,
  type AdminPermission,
  type AdminPermissions,
  type Role,
} from "@/lib/types";
import {
  LOCAL_AUTH_COOKIE,
  LOCAL_USER_ID,
  committeeAllowlist,
  isNeonAuthConfigured,
} from "@/lib/auth-constants";
import {
  COMMITTEE_SESSION_COOKIE,
  readCommitteeSessionToken,
} from "@/lib/committee-session";
import { getNeonAuth } from "@/lib/neon-auth";

export { LOCAL_AUTH_COOKIE, LOCAL_USER_ID, isNeonAuthConfigured };

export type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
  personId: string | null;
  permissions: AdminPermissions;
  isLocal: boolean;
};

function isAllowlisted(email: string | null) {
  return Boolean(email && committeeAllowlist().includes(email.toLowerCase()));
}

function roleForEmail(email: string | null, stored: Role): Role {
  if (isAllowlisted(email)) return "super_admin";
  return stored;
}

export function userHasPermission(user: AppUser, key: AdminPermission) {
  return hasPermission(user.role, user.permissions, key);
}

export function committeeHomePath(user: AppUser) {
  if (userHasPermission(user, "people.edit")) return "/admin";
  if (userHasPermission(user, "people.create")) return "/admin/people/new";
  if (userHasPermission(user, "requests.review")) return "/admin/requests";
  if (userHasPermission(user, "activity.view")) return "/admin/activity";
  if (user.role === "super_admin") return "/admin/committee";
  return "/";
}

async function userFromProfile(input: {
  id: string;
  email: string | null;
  name?: string | null;
  role: Role;
  personId: string | null;
  permissions?: AdminPermissions;
  isLocal: boolean;
  elevate?: boolean;
}): Promise<AppUser> {
  const role =
    input.elevate === false ? input.role : roleForEmail(input.email, input.role);
  return {
    id: input.id,
    email: input.email,
    name: input.name ?? input.email,
    role,
    personId: input.personId,
    permissions: parseAdminPermissions(input.permissions, role),
    isLocal: input.isLocal,
  };
}

export async function getAppUser(): Promise<AppUser | null> {
  const store = await cookies();
  const committee = await readCommitteeSessionToken(
    store.get(COMMITTEE_SESSION_COOKIE)?.value,
  );
  if (committee) {
    const profile =
      (await getProfile(committee.userId)) ??
      (await findProfileByEmail(committee.email));
    return userFromProfile({
      id: profile?.userId ?? committee.userId,
      email: committee.email,
      role: profile?.role ?? "admin",
      personId: profile?.personId ?? null,
      permissions: profile?.permissions,
      isLocal: false,
    });
  }

  if (isNeonAuthConfigured()) {
    const { data: session } = await getNeonAuth().getSession();
    const user = session?.user;
    if (!user) return null;
    const email = user.email ?? null;
    const profile = await getProfile(user.id);
    return userFromProfile({
      id: user.id,
      email,
      name: user.name ?? null,
      role: "member",
      personId: profile?.personId ?? null,
      permissions: profile?.permissions,
      isLocal: false,
      elevate: false,
    });
  }

  if (store.get(LOCAL_AUTH_COOKIE)?.value !== "1") return null;
  const profile = await getProfile(LOCAL_USER_ID);
  return userFromProfile({
    id: LOCAL_USER_ID,
    email: profile?.email ?? null,
    name: "Family editor",
    role: profile?.role ?? "super_admin",
    personId: profile?.personId ?? null,
    permissions: profile?.permissions,
    isLocal: true,
  });
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

export async function requirePermission(key: AdminPermission) {
  const user = await requireAdmin();
  if (!userHasPermission(user, key)) {
    throw new Error("You do not have permission to do that.");
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
  return userHasPermission(user, "people.edit");
}

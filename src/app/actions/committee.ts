"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  deleteCommitteeInvite,
  deletePendingInvitesForEmail,
  findPendingInvite,
  findProfileByEmail,
  getCommitteeInvite,
  getProfile,
  getSnapshot,
  saveCommitteeInvite,
  upsertProfile,
} from "@/lib/store";
import {
  ADMIN_PERMISSION_KEYS,
  defaultAdminPermissions,
  parseAdminPermissions,
  type AdminPermissions,
} from "@/lib/types";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function demoteAdminAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const userId = str(formData, "userId");
  const snapshot = await getSnapshot();
  const profile = snapshot.profiles.find((row) => row.userId === userId);
  if (!profile) throw new Error("That login was not found.");
  if (profile.role === "member") {
    throw new Error("That person is already a member.");
  }
  if (profile.role === "super_admin") {
    const remaining = snapshot.profiles.filter(
      (row) => row.userId !== userId && row.role === "super_admin",
    ).length;
    if (remaining < 1) {
      throw new Error("The last super admin cannot be removed.");
    }
  }
  await upsertProfile({ ...profile, role: "member" });
  if (profile.email) {
    await deletePendingInvitesForEmail(profile.email);
  }
  await recordAudit(
    actor,
    "role.change",
    profile.email ?? profile.userId,
    `Demoted from ${profile.role.replace("_", " ")} to member`,
    profile.userId,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/committee");
  revalidatePath("/admin/activity");
}

export async function inviteAdminAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const email = str(formData, "email").toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  const snapshot = await getSnapshot();
  const existing = snapshot.profiles.find((row) => row.email?.toLowerCase() === email);
  if (existing?.role === "super_admin") {
    revalidatePath("/admin/committee");
    return;
  }

  await upsertProfile({
    userId: existing?.userId ?? `email:${email}`,
    personId: existing?.personId ?? null,
    role: "admin",
    email,
    permissions: existing?.permissions ?? defaultAdminPermissions(),
  });

  if (existing?.role === "member") {
    await recordAudit(
      actor,
      "role.change",
      email,
      "Promoted existing login to admin",
      existing.userId,
    );
  } else if (!existing) {
    const pending = await findPendingInvite(email);
    if (!pending) {
      await saveCommitteeInvite({
        id: `invite-${crypto.randomUUID()}`,
        email,
        invitedByUserId: actor.id,
        invitedByEmail: actor.email,
        createdAt: new Date().toISOString(),
        usedAt: null,
      });
    }
    await recordAudit(actor, "role.change", email, "Invited as admin", email);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/committee");
  revalidatePath("/admin/activity");
}

export async function cancelAdminInviteAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const inviteId = str(formData, "inviteId");
  const invite = await getCommitteeInvite(inviteId);
  if (!invite) {
    throw new Error("That invite was not found.");
  }
  if (invite.usedAt) {
    throw new Error("That invite was already used.");
  }

  await deleteCommitteeInvite(invite.id);

  const profile = await findProfileByEmail(invite.email);
  if (profile && profile.role === "admin") {
    await upsertProfile({ ...profile, role: "member" });
  }

  await recordAudit(
    actor,
    "role.change",
    invite.email,
    "Cancelled an admin invite",
    profile?.userId ?? invite.email,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/committee");
  revalidatePath("/admin/activity");
}

export async function updateAdminPermissionsAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const userId = str(formData, "userId");
  const profile = await getProfile(userId);
  if (!profile) throw new Error("That login was not found.");
  if (profile.role !== "admin") {
    throw new Error("Permissions can only be changed for regular admins.");
  }
  const permissions = Object.fromEntries(
    ADMIN_PERMISSION_KEYS.map((key) => [key, formData.get(key) === "on"]),
  ) as AdminPermissions;
  await upsertProfile({
    ...profile,
    permissions: parseAdminPermissions(permissions, "admin"),
  });
  await recordAudit(
    actor,
    "role.change",
    profile.email ?? profile.userId,
    "Updated admin tools",
    profile.userId,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/committee");
  revalidatePath("/admin/activity");
}

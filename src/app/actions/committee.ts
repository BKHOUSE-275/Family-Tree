"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { committeeAllowlist } from "@/lib/auth-constants";
import {
  findPendingInvite,
  getProfile,
  getSnapshot,
  saveCommitteeInvite,
  upsertProfile,
} from "@/lib/store";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isEnvSuper(email: string | null) {
  return Boolean(email && committeeAllowlist().includes(email.toLowerCase()));
}

export async function promoteAdminAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const userId = str(formData, "userId");
  const profile = await getProfile(userId);
  if (!profile) throw new Error("That login was not found.");
  if (profile.role !== "member") {
    throw new Error("Only members can be promoted to admin.");
  }
  await upsertProfile({ ...profile, role: "admin" });
  await recordAudit(
    actor,
    "role.change",
    profile.email ?? profile.userId,
    "Promoted to admin",
    profile.userId,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/committee");
  revalidatePath("/admin/activity");
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
  if (isEnvSuper(profile.email)) {
    throw new Error("Env-listed super admins cannot be demoted here. Change ADMIN_EMAILS instead.");
  }
  if (profile.role === "super_admin") {
    const remaining =
      snapshot.profiles.filter((row) => row.userId !== userId && row.role === "super_admin").length +
      committeeAllowlist().filter((email) => email !== profile.email?.toLowerCase()).length;
    if (remaining < 1) {
      throw new Error("The last super admin cannot be removed.");
    }
  }
  await upsertProfile({ ...profile, role: "member" });
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
  if (existing) {
    if (existing.role === "member") {
      await upsertProfile({ ...existing, role: "admin" });
      await recordAudit(
        actor,
        "role.change",
        email,
        "Promoted existing login to admin",
        existing.userId,
      );
    }
  } else {
    const pending = await findPendingInvite(email);
    if (pending) {
      throw new Error("That email already has a pending admin invite.");
    }
    await saveCommitteeInvite({
      id: `invite-${crypto.randomUUID()}`,
      email,
      invitedByUserId: actor.id,
      invitedByEmail: actor.email,
      createdAt: new Date().toISOString(),
      usedAt: null,
    });
    await recordAudit(actor, "role.change", email, "Invited as admin", email);
  }
  revalidatePath("/admin/committee");
  revalidatePath("/admin/activity");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUser, requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notifyCommitteeOfRequest } from "@/lib/mail";
import { getChangeRequest, getPerson, saveChangeRequest, savePerson } from "@/lib/store";
import { displayName, type ChangeRequest } from "@/lib/types";

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function submitChangeRequestAction(formData: FormData) {
  const user = await getAppUser();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) {
    throw new Error("Please write what you would like the committee to review.");
  }

  const email = str(formData, "email") ?? user?.email;
  if (!email) {
    throw new Error("Please leave an email so the committee can follow up.");
  }

  const name = str(formData, "name");
  const request: ChangeRequest = {
    id: `req-${crypto.randomUUID()}`,
    submitterUserId: user?.id ?? "guest",
    submitterEmail: email,
    personId: str(formData, "personId"),
    message: name ? `From ${name}\n\n${message}` : message,
    photoUrl: str(formData, "photoUrl"),
    headstonePhotoUrl: str(formData, "headstonePhotoUrl"),
    status: "pending",
    adminNote: null,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  };

  await saveChangeRequest(request);
  try {
    await notifyCommitteeOfRequest(request);
  } catch (error) {
    console.error("Could not notify the committee", error);
  }

  revalidatePath("/admin/requests");
  revalidatePath("/");
  redirect("/?sent=1#suggest");
}

export async function reviewChangeRequestAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const current = await getChangeRequest(id);
  if (!current) {
    throw new Error("That request was not found.");
  }

  const status = decision === "approved" ? "approved" : "rejected";
  const next: ChangeRequest = {
    ...current,
    status,
    adminNote: str(formData, "adminNote"),
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.id,
  };

  if (status === "approved" && current.personId) {
    const person = await getPerson(current.personId);
    if (person) {
      const updated = { ...person };
      if (bool(formData, "attachPhoto") && current.photoUrl) {
        updated.photoUrl = current.photoUrl;
      }
      if (bool(formData, "attachHeadstone") && current.headstonePhotoUrl) {
        updated.headstonePhotoUrl = current.headstonePhotoUrl;
      }
      if (updated !== person && (updated.photoUrl !== person.photoUrl || updated.headstonePhotoUrl !== person.headstonePhotoUrl)) {
        await savePerson(updated);
      }
    }
  }

  await saveChangeRequest(next);
  const person = current.personId ? await getPerson(current.personId) : null;
  await recordAudit(
    user,
    status === "approved" ? "request.approve" : "request.reject",
    person ? displayName(person) : "Family suggestion",
    status === "approved" ? "Approved a change request" : "Rejected a change request",
    current.personId,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/activity");
  revalidatePath("/");
  revalidatePath("/tree");
  if (current.personId) {
    revalidatePath(`/admin/people/${current.personId}`);
  }
}

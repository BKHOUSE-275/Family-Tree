"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUser, requirePermission, requireSuperAdmin } from "@/lib/auth";
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

async function personLabel(id: string | null) {
  if (!id) return null;
  const person = await getPerson(id);
  return person ? displayName(person) : null;
}

function composePersonName(parts: {
  givenName: string | null;
  surname: string | null;
  nickname: string | null;
  suffix: string | null;
}) {
  const base = [parts.givenName, parts.surname].filter(Boolean).join(" ");
  const withNick =
    parts.nickname && base ? `${base} (${parts.nickname})` : base || parts.nickname;
  return parts.suffix && withNick ? `${withNick}, ${parts.suffix}` : withNick;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  child: "Child of",
  parent: "Parent of",
  spouse: "Spouse of",
  sibling: "Sibling of",
};

function buildChangeInfoMessage(input: {
  submitterName: string;
  submitterPhone: string;
  email: string | null;
  personLabel: string;
  givenName: string;
  surname: string | null;
  nickname: string | null;
  suffix: string | null;
  personPhone: string;
  personEmail: string | null;
  address: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  isDeceased: boolean;
  deathDate: string | null;
  headstoneLocation: string | null;
  parent1Label: string | null;
  parent2Label: string | null;
  spouseLabel: string | null;
  marriageDate: string | null;
  marriagePlace: string | null;
}) {
  const fullName = composePersonName({
    givenName: input.givenName,
    surname: input.surname,
    nickname: input.nickname,
    suffix: input.suffix,
  });

  return [
    "Type: change_info",
    `From: ${input.submitterName}`,
    `Phone: ${input.submitterPhone}`,
    `Email: ${input.email ?? "(none)"}`,
    "",
    `Person: ${input.personLabel}`,
    `Given name: ${input.givenName}`,
    `Surname: ${input.surname ?? "(none)"}`,
    `Nickname: ${input.nickname ?? "(none)"}`,
    `Suffix: ${input.suffix ?? "(none)"}`,
    `Full name: ${fullName}`,
    `Proposed phone: ${input.personPhone}`,
    `Proposed email: ${input.personEmail ?? "(none)"}`,
    `Address: ${input.address ?? "(none)"}`,
    `Birth date: ${input.birthDate ?? "(none)"}`,
    `Birth place: ${input.birthPlace ?? "(none)"}`,
    `Deceased: ${input.isDeceased ? "yes" : "no"}`,
    `Death date: ${input.deathDate ?? "(none)"}`,
    `Headstone location: ${input.headstoneLocation ?? "(none)"}`,
    `Parent 1: ${input.parent1Label ?? "(none)"}`,
    `Parent 2: ${input.parent2Label ?? "(none)"}`,
    `Spouse: ${input.spouseLabel ?? "(none)"}`,
    `Marriage date: ${input.marriageDate ?? "(none)"}`,
    `Marriage place: ${input.marriagePlace ?? "(none)"}`,
  ].join("\n");
}

function buildAddPersonMessage(input: {
  submitterName: string;
  submitterPhone: string;
  email: string | null;
  givenName: string;
  surname: string | null;
  nickname: string | null;
  suffix: string | null;
  personPhone: string;
  personEmail: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  isDeceased: boolean;
  deathDate: string | null;
  headstoneLocation: string | null;
  relationshipType: string;
  relatedLabel: string;
  parent1Label: string | null;
  parent2Label: string | null;
  spouseLabel: string | null;
  marriageDate: string | null;
  marriagePlace: string | null;
}) {
  const fullName = composePersonName({
    givenName: input.givenName,
    surname: input.surname,
    nickname: input.nickname,
    suffix: input.suffix,
  });
  const relationship =
    RELATIONSHIP_LABELS[input.relationshipType] ?? input.relationshipType;

  return [
    "Type: add_person",
    `From: ${input.submitterName}`,
    `Phone: ${input.submitterPhone}`,
    `Email: ${input.email ?? "(none)"}`,
    "",
    `Given name: ${input.givenName}`,
    `Surname: ${input.surname ?? "(none)"}`,
    `Nickname: ${input.nickname ?? "(none)"}`,
    `Suffix: ${input.suffix ?? "(none)"}`,
    `Full name: ${fullName}`,
    `Proposed phone: ${input.personPhone}`,
    `Proposed email: ${input.personEmail ?? "(none)"}`,
    `Birth date: ${input.birthDate ?? "(none)"}`,
    `Birth place: ${input.birthPlace ?? "(none)"}`,
    `Deceased: ${input.isDeceased ? "yes" : "no"}`,
    `Death date: ${input.deathDate ?? "(none)"}`,
    `Headstone location: ${input.headstoneLocation ?? "(none)"}`,
    `Relationship: ${relationship} ${input.relatedLabel}`,
    `Parent 1: ${input.parent1Label ?? "(none)"}`,
    `Parent 2: ${input.parent2Label ?? "(none)"}`,
    `Spouse: ${input.spouseLabel ?? "(none)"}`,
    `Marriage date: ${input.marriageDate ?? "(none)"}`,
    `Marriage place: ${input.marriagePlace ?? "(none)"}`,
  ].join("\n");
}

export async function submitChangeRequestAction(formData: FormData) {
  const user = await getAppUser();
  const requestTypeRaw = str(formData, "requestType");
  if (requestTypeRaw !== "change_info" && requestTypeRaw !== "add_person") {
    throw new Error("Please choose how you would like to suggest an update.");
  }
  const requestType = requestTypeRaw;

  const submitterName = str(formData, "submitterName");
  if (!submitterName) {
    throw new Error("Please leave your name so the committee knows who requested this.");
  }

  const submitterPhone = str(formData, "submitterPhone");
  if (!submitterPhone) {
    throw new Error("Please leave a phone number so the committee can follow up.");
  }

  const email = str(formData, "email") ?? user?.email ?? null;
  const personPhone = str(formData, "personPhone");
  if (!personPhone) {
    throw new Error("Please include a phone number for this person.");
  }
  const personEmail = str(formData, "personEmail");
  const personId = str(formData, "personId");

  let message: string;

  if (requestType === "change_info") {
    const givenName = str(formData, "givenName");
    if (!givenName) {
      throw new Error("Please include the person's given name.");
    }
    if (!personId) {
      throw new Error("Please select which person this change is about.");
    }
    const about = await personLabel(personId);
    if (!about) {
      throw new Error("That person was not found.");
    }
    const parentId1 = str(formData, "parentId1");
    const parentId2 = str(formData, "parentId2");
    const partnerId = str(formData, "partnerId");
    message = buildChangeInfoMessage({
      submitterName,
      submitterPhone,
      email,
      personLabel: about,
      givenName,
      surname: str(formData, "surname"),
      nickname: str(formData, "nickname"),
      suffix: str(formData, "suffix"),
      personPhone,
      personEmail,
      address: str(formData, "address"),
      birthDate: str(formData, "birthDate"),
      birthPlace: str(formData, "birthPlace"),
      isDeceased: bool(formData, "isDeceased"),
      deathDate: str(formData, "deathDate"),
      headstoneLocation: str(formData, "headstoneLocation"),
      parent1Label: await personLabel(parentId1),
      parent2Label: await personLabel(parentId2),
      spouseLabel: await personLabel(partnerId),
      marriageDate: str(formData, "marriageDate"),
      marriagePlace: str(formData, "marriagePlace"),
    });
  } else {
    const givenName = str(formData, "givenName");
    if (!givenName) {
      throw new Error("Please include the person's given name.");
    }
    const relationshipType = str(formData, "relationshipType");
    if (
      !relationshipType ||
      !["child", "parent", "spouse", "sibling"].includes(relationshipType)
    ) {
      throw new Error("Please say how this person is related.");
    }
    if (!personId) {
      throw new Error("Please select who this person is related to.");
    }
    const relatedLabel = await personLabel(personId);
    if (!relatedLabel) {
      throw new Error("That related person was not found.");
    }

    const parentId1 = str(formData, "parentId1");
    const parentId2 = str(formData, "parentId2");
    const partnerId = str(formData, "partnerId");

    message = buildAddPersonMessage({
      submitterName,
      submitterPhone,
      email,
      givenName,
      surname: str(formData, "surname"),
      nickname: str(formData, "nickname"),
      suffix: str(formData, "suffix"),
      personPhone,
      personEmail,
      birthDate: str(formData, "birthDate"),
      birthPlace: str(formData, "birthPlace"),
      isDeceased: bool(formData, "isDeceased"),
      deathDate: str(formData, "deathDate"),
      headstoneLocation: str(formData, "headstoneLocation"),
      relationshipType,
      relatedLabel,
      parent1Label: await personLabel(parentId1),
      parent2Label: await personLabel(parentId2),
      spouseLabel: await personLabel(partnerId),
      marriageDate: str(formData, "marriageDate"),
      marriagePlace: str(formData, "marriagePlace"),
    });
  }

  const request: ChangeRequest = {
    id: `req-${crypto.randomUUID()}`,
    submitterUserId: user?.id ?? "guest",
    submitterEmail: email,
    personId,
    message,
    photoUrl: str(formData, "photoUrl"),
    headstonePhotoUrl: str(formData, "headstonePhotoUrl"),
    status: "pending",
    adminNote: null,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  };

  await saveChangeRequest(request);
  await recordAudit(
    user ?? { id: request.submitterUserId, email },
    "request.submit",
    personId ? ((await personLabel(personId)) ?? "Family suggestion") : "Family suggestion",
    requestType === "add_person" ? "Asked to add a person" : "Sent a change for review",
    personId,
  );
  try {
    await notifyCommitteeOfRequest(request);
  } catch (error) {
    console.error("Could not notify the committee", error);
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin/activity");
  revalidatePath("/");
  redirect("/?sent=1#suggest");
}

export async function reviewChangeRequestAction(formData: FormData) {
  const user = await requirePermission("requests.review");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const current = await getChangeRequest(id);
  if (!current) {
    throw new Error("That request was not found.");
  }

  const status = decision === "approved" ? "approved" : "rejected";
  let photoNote = "";
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
      if (updated.photoUrl !== person.photoUrl || updated.headstonePhotoUrl !== person.headstonePhotoUrl) {
        await savePerson(updated);
        photoNote = " · attached submitted photos";
      }
    }
  }

  await saveChangeRequest(next);
  const person = current.personId ? await getPerson(current.personId) : null;
  await recordAudit(
    user,
    status === "approved" ? "request.approve" : "request.reject",
    person ? displayName(person) : "Family suggestion",
    status === "approved" ? `Approved a change request${photoNote}` : "Rejected a change request",
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

export async function cancelChangeRequestAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await getChangeRequest(id);
  if (!current) {
    throw new Error("That request was not found.");
  }
  if (current.status !== "pending") {
    throw new Error("Only pending requests can be cancelled.");
  }

  const next: ChangeRequest = {
    ...current,
    status: "rejected",
    adminNote: str(formData, "adminNote") ?? "Cancelled by super admin",
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.id,
  };
  await saveChangeRequest(next);
  const person = current.personId ? await getPerson(current.personId) : null;
  await recordAudit(
    user,
    "request.reject",
    person ? displayName(person) : "Family suggestion",
    "Cancelled a pending change request",
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

"use server";

import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { personFieldDiff, recordAudit } from "@/lib/audit";
import {
  deletePerson,
  getPerson,
  getProfile,
  getSnapshot,
  saveContact,
  savePartnership,
  savePerson,
  saveResidences,
  setParents,
  upsertProfile,
} from "@/lib/store";
import { displayName, type Contact, type Partnership, type Person, type Residence } from "@/lib/types";

function slugId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "person"}-${crypto.randomUUID().slice(0, 6)}`;
}

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function savePersonAction(formData: FormData) {
  const user = await requireAdmin();
  const existingId = str(formData, "id");
  const givenName = String(formData.get("givenName") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  if (!givenName) throw new Error("A given name is required.");

  const snapshot = await getSnapshot();
  const before = existingId
    ? snapshot.people.find((row) => row.id === existingId) ?? null
    : null;
  const beforeParents = existingId
    ? snapshot.parentChildren
        .filter((link) => link.childId === existingId)
        .map((link) => link.parentId)
        .sort()
        .join(",")
    : "";
  const beforePartner =
    existingId
      ? snapshot.partnerships.find(
          (union) => union.personAId === existingId || union.personBId === existingId,
        )
      : undefined;
  const beforePartnerId = beforePartner
    ? beforePartner.personAId === existingId
      ? beforePartner.personBId
      : beforePartner.personAId
    : "";
  const beforeResidences = existingId
    ? snapshot.residences
        .filter((row) => row.personId === existingId)
        .map((row) => `${row.year ?? ""}:${row.place}`)
        .join("|")
    : "";

  const person: Person = {
    id: existingId ?? slugId(`${givenName} ${surname}`),
    givenName,
    surname,
    nickname: str(formData, "nickname"),
    suffix: str(formData, "suffix"),
    photoUrl: str(formData, "photoUrl"),
    birthDate: str(formData, "birthDate"),
    birthPlace: str(formData, "birthPlace"),
    deathDate: str(formData, "deathDate"),
    isDeceased: bool(formData, "isDeceased"),
    headstoneLocation: str(formData, "headstoneLocation"),
    headstonePhotoUrl: str(formData, "headstonePhotoUrl"),
    familysearchId: str(formData, "familysearchId"),
    notes: str(formData, "notes"),
  };
  await savePerson(person);

  const parentIds = [str(formData, "parentId1"), str(formData, "parentId2")].filter(
    (id): id is string => Boolean(id),
  );
  await setParents(person.id, parentIds);

  const partnerId = str(formData, "partnerId");
  if (partnerId) {
    const union: Partnership = {
      id: str(formData, "partnershipId") ?? `union-${person.id}-${partnerId}`,
      personAId: person.id,
      personBId: partnerId,
      startDate: str(formData, "marriageDate"),
      place: str(formData, "marriagePlace"),
      notes: str(formData, "marriageNotes"),
    };
    await savePartnership(union);
  }

  const years = formData.getAll("residenceYear").map(String);
  const places = formData.getAll("residencePlace").map(String);
  const rows: Residence[] = places
    .map((place, index) => ({
      id: `res-${person.id}-${index + 1}`,
      personId: person.id,
      year: years[index]?.trim() || null,
      place: place.trim(),
    }))
    .filter((row) => row.place);
  await saveResidences(person.id, rows);

  const extras: string[] = [];
  if (beforeParents !== [...parentIds].sort().join(",")) extras.push("Parents");
  if (beforePartnerId !== (partnerId ?? "")) extras.push("Spouse");
  const afterResidences = rows.map((row) => `${row.year ?? ""}:${row.place}`).join("|");
  if (beforeResidences !== afterResidences) extras.push("Residences");

  await recordAudit(
    user,
    before ? "person.update" : "person.create",
    displayName(person),
    personFieldDiff(before, person, extras),
    person.id,
  );

  revalidatePath("/");
  revalidatePath("/tree");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  revalidatePath(`/admin/people/${person.id}`);
  return { id: person.id, savedBy: user.id };
}

export async function savePersonAndRedirect(formData: FormData): Promise<void> {
  const result = await savePersonAction(formData);
  redirect(`/admin/people/${result.id}`);
}

export async function deletePersonAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const person = await getPerson(id);
  await deletePerson(id);
  await recordAudit(
    user,
    "person.delete",
    person ? displayName(person) : id,
    "Removed from the tree",
    id,
  );
  revalidatePath("/");
  revalidatePath("/tree");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
}

export async function saveContactAction(formData: FormData) {
  const user = await requireAdmin();
  const personId = String(formData.get("personId") ?? "");
  if (!personId) {
    throw new Error("A person is required.");
  }
  const snapshot = await getSnapshot();
  const person = snapshot.people.find((row) => row.id === personId) ?? null;
  const before = snapshot.contacts.find((row) => row.personId === personId);
  const contact: Contact = {
    personId,
    address: str(formData, "address"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    shareAddress: bool(formData, "shareAddress"),
    sharePhone: bool(formData, "sharePhone"),
    shareEmail: bool(formData, "shareEmail"),
  };
  await saveContact(contact);
  const fields = ["address", "phone", "email", "shareAddress", "sharePhone", "shareEmail"] as const;
  const changed = fields.filter((key) => (before?.[key] ?? null) !== contact[key]);
  await recordAudit(
    user,
    "contact.update",
    person ? displayName(person) : personId,
    changed.length ? changed.join(", ") : "Updated contact",
    personId,
  );
  revalidatePath("/");
  revalidatePath("/tree");
  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  revalidatePath(`/admin/people/${personId}`);
}

export async function linkProfileAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const personId = str(formData, "personId");
  if (!userId) throw new Error("A user id is required.");
  const current = await getProfile(userId);
  await upsertProfile({
    userId,
    personId,
    role: current?.role ?? "member",
    email: current?.email ?? null,
  });
  revalidatePath("/admin");
  revalidatePath("/profile");
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function uploadPhotoAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a photo to upload.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Please choose a photo under 8 MB.");
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`family/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }

  if (process.env.VERCEL) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN to upload photos on Vercel.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), bytes);
  return { url: `/uploads/${safeName}` };
}

"use server";

import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { personFieldDiff, recordAudit } from "@/lib/audit";
import {
  deletePartnershipsForPerson,
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
import { preparePhotoUpload } from "@/lib/photo";
import { defaultAdminPermissions, displayName, type Contact, type Partnership, type Person, type Residence } from "@/lib/types";

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

function actionError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
  return error instanceof Error ? error.message : "Could not save. Try again.";
}

export type SavePersonState = { error?: string; ok?: boolean; id?: string } | null;
export type FormActionState = { error?: string; ok?: boolean } | null;

export async function savePersonAction(
  _prev: SavePersonState,
  formData: FormData,
): Promise<SavePersonState> {
  let savedId = "";
  try {
    const existingId = str(formData, "id");
    const user = existingId
      ? await requirePermission("people.edit")
      : await requirePermission("people.create");
    const givenName = String(formData.get("givenName") ?? "").trim();
    const surname = String(formData.get("surname") ?? "").trim();
    if (!givenName) return { error: "A given name is required." };

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
    const beforePartner = existingId
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
      maidenName: str(formData, "maidenName"),
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
      showPhoto: bool(formData, "showPhoto"),
      showMaidenName: bool(formData, "showMaidenName"),
      showBirthDate: bool(formData, "showBirthDate"),
      showBirthPlace: bool(formData, "showBirthPlace"),
      showDeathDate: bool(formData, "showDeathDate"),
      showHeadstone: bool(formData, "showHeadstone"),
      showNotes: bool(formData, "showNotes"),
      showResidences: bool(formData, "showResidences"),
      showMarriage: bool(formData, "showMarriage"),
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
    } else {
      await deletePartnershipsForPerson(person.id);
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
    savedId = person.id;
  } catch (error) {
    return { error: actionError(error) };
  }
  redirect(`/admin/people/${savedId}?saved=1`);
}

export async function deletePersonAction(formData: FormData) {
  const user = await requirePermission("people.delete");
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

export async function saveContactAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    const user = await requireAdmin();
    const personId = String(formData.get("personId") ?? "");
    if (!personId) return { error: "A person is required." };
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
    return { ok: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function linkProfileAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    const user = await requirePermission("profiles.link");
    const userId = String(formData.get("userId") ?? "").trim();
    const personId = str(formData, "personId");
    if (!userId) return { error: "A user id is required." };
    const current = await getProfile(userId);
    await upsertProfile({
      userId,
      personId,
      role: current?.role ?? "member",
      email: current?.email ?? null,
      permissions: current?.permissions ?? defaultAdminPermissions(),
    });
    const snapshot = await getSnapshot();
    const person = personId
      ? snapshot.people.find((row) => row.id === personId)
      : null;
    await recordAudit(
      user,
      "profile.link",
      current?.email ?? userId,
      person ? `Linked to ${displayName(person)}` : "Unlinked from the tree",
      personId,
    );
    revalidatePath("/admin");
    revalidatePath("/admin/committee");
    revalidatePath("/admin/activity");
    revalidatePath("/profile");
    return { ok: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function photoFileFromForm(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a photo to upload.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Please choose a photo under 8 MB.");
  }
  return file;
}

async function storePhotoBytes(body: Buffer, pathname: string, contentType: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType,
    });
    return { url: blob.url };
  }

  if (process.env.VERCEL) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN to upload photos on Vercel.");
  }

  const safeName = path.basename(pathname);
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), body);
  return { url: `/uploads/${safeName}` };
}

export async function uploadPhotoAction(formData: FormData) {
  try {
    const photo = await preparePhotoUpload(photoFileFromForm(formData));
    return storePhotoBytes(photo.body, photo.pathname, photo.contentType);
  } catch (error) {
    return { error: actionError(error) };
  }
}

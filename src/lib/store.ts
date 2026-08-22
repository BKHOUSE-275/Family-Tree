import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { seedSnapshot } from "@/data/seed";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import {
  contacts,
  parentChildren,
  partnerships,
  people,
  profiles,
  residences,
  siblings,
} from "@/lib/db/schema";
import type {
  Contact,
  FamilySnapshot,
  ParentChild,
  Partnership,
  Person,
  Profile,
  Residence,
  Role,
  Sibling,
} from "@/lib/types";
import { ROOT_FATHER_ID, ROOT_MOTHER_ID } from "@/lib/types";

const LOCAL_FILE = path.join(process.cwd(), ".data", "family.json");

declare global {
  var __familyMemory: FamilySnapshot | undefined;
}

function cloneSeed(): FamilySnapshot {
  return structuredClone(seedSnapshot);
}

async function readLocal(): Promise<FamilySnapshot> {
  if (globalThis.__familyMemory) {
    return globalThis.__familyMemory;
  }
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as FamilySnapshot;
    globalThis.__familyMemory = parsed;
    return parsed;
  } catch {
    const seed = cloneSeed();
    globalThis.__familyMemory = seed;
    return seed;
  }
}

async function writeLocal(snapshot: FamilySnapshot) {
  globalThis.__familyMemory = snapshot;
  try {
    await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await writeFile(LOCAL_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  } catch {
    // Read-only hosts (Vercel) keep the in-memory copy for this instance only.
  }
}

function mapPerson(row: typeof people.$inferSelect): Person {
  return {
    id: row.id,
    givenName: row.givenName,
    surname: row.surname,
    nickname: row.nickname,
    suffix: row.suffix,
    photoUrl: row.photoUrl,
    birthDate: row.birthDate,
    birthPlace: row.birthPlace,
    deathDate: row.deathDate,
    isDeceased: row.isDeceased,
    headstoneLocation: row.headstoneLocation,
    familysearchId: row.familysearchId,
    notes: row.notes,
  };
}

async function ensureNeonSeeded() {
  const db = getDb();
  const existing = await db.select({ id: people.id }).from(people).limit(1);
  if (existing.length > 0) return;
  await insertSnapshot(seedSnapshot);
}

async function insertSnapshot(snapshot: FamilySnapshot) {
  const db = getDb();
  if (snapshot.people.length) {
    await db.insert(people).values(
      snapshot.people.map((p) => ({
        ...p,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }
  if (snapshot.contacts.length) {
    await db.insert(contacts).values(snapshot.contacts);
  }
  if (snapshot.parentChildren.length) {
    await db.insert(parentChildren).values(snapshot.parentChildren);
  }
  if (snapshot.partnerships.length) {
    await db.insert(partnerships).values(snapshot.partnerships);
  }
  if (snapshot.residences.length) {
    await db.insert(residences).values(snapshot.residences);
  }
  if (snapshot.siblings.length) {
    await db.insert(siblings).values(snapshot.siblings);
  }
  if (snapshot.profiles.length) {
    await db.insert(profiles).values(snapshot.profiles);
  }
}

async function loadFromNeon(): Promise<FamilySnapshot> {
  await ensureNeonSeeded();
  const db = getDb();
  const [
    peopleRows,
    contactRows,
    parentRows,
    partnershipRows,
    residenceRows,
    siblingRows,
    profileRows,
  ] = await Promise.all([
    db.select().from(people),
    db.select().from(contacts),
    db.select().from(parentChildren),
    db.select().from(partnerships),
    db.select().from(residences),
    db.select().from(siblings),
    db.select().from(profiles),
  ]);
  return {
    people: peopleRows.map(mapPerson),
    contacts: contactRows,
    parentChildren: parentRows,
    partnerships: partnershipRows,
    residences: residenceRows,
    siblings: siblingRows,
    profiles: profileRows.map((row) => ({
      userId: row.userId,
      personId: row.personId,
      role: row.role,
      email: row.email,
    })),
  };
}

export async function getSnapshot(): Promise<FamilySnapshot> {
  if (isDatabaseConfigured()) {
    return loadFromNeon();
  }
  return readLocal();
}

export async function getPerson(id: string) {
  const snapshot = await getSnapshot();
  return snapshot.people.find((p) => p.id === id) ?? null;
}

export function childrenOf(snapshot: FamilySnapshot, parentId: string) {
  const childIds = snapshot.parentChildren
    .filter((link) => link.parentId === parentId)
    .map((link) => link.childId);
  return snapshot.people.filter((p) => childIds.includes(p.id));
}

export function parentsOf(snapshot: FamilySnapshot, childId: string) {
  const parentIds = snapshot.parentChildren
    .filter((link) => link.childId === childId)
    .map((link) => link.parentId);
  return snapshot.people.filter((p) => parentIds.includes(p.id));
}

export function partnersOf(snapshot: FamilySnapshot, personId: string) {
  return snapshot.partnerships.filter(
    (union) => union.personAId === personId || union.personBId === personId,
  );
}

export function isRootPerson(id: string) {
  return id === ROOT_FATHER_ID || id === ROOT_MOTHER_ID;
}

export function isPlaced(snapshot: FamilySnapshot, personId: string) {
  if (isRootPerson(personId)) return true;
  return snapshot.parentChildren.some((link) => link.childId === personId);
}

export async function savePerson(input: Person) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    const existing = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.id, input.id))
      .limit(1);
    if (existing.length) {
      await db
        .update(people)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(people.id, input.id));
    } else {
      await db.insert(people).values({ ...input, updatedAt: new Date() });
    }
    return;
  }
  const snapshot = await readLocal();
  const index = snapshot.people.findIndex((p) => p.id === input.id);
  if (index >= 0) snapshot.people[index] = input;
  else snapshot.people.push(input);
  await writeLocal(snapshot);
}

export async function deletePerson(id: string) {
  if (isRootPerson(id)) {
    throw new Error("Felix and Adaline cannot be removed from the tree.");
  }
  if (isDatabaseConfigured()) {
    const db = getDb();
    await db.delete(people).where(eq(people.id, id));
    return;
  }
  const snapshot = await readLocal();
  snapshot.people = snapshot.people.filter((p) => p.id !== id);
  snapshot.contacts = snapshot.contacts.filter((c) => c.personId !== id);
  snapshot.parentChildren = snapshot.parentChildren.filter(
    (l) => l.parentId !== id && l.childId !== id,
  );
  snapshot.partnerships = snapshot.partnerships.filter(
    (u) => u.personAId !== id && u.personBId !== id,
  );
  snapshot.residences = snapshot.residences.filter((r) => r.personId !== id);
  snapshot.siblings = snapshot.siblings.filter(
    (s) => s.personAId !== id && s.personBId !== id,
  );
  snapshot.profiles = snapshot.profiles.map((p) =>
    p.personId === id ? { ...p, personId: null } : p,
  );
  await writeLocal(snapshot);
}

export async function setParents(childId: string, parentIds: string[]) {
  const unique = [...new Set(parentIds.filter(Boolean))];
  if (isDatabaseConfigured()) {
    const db = getDb();
    await db.delete(parentChildren).where(eq(parentChildren.childId, childId));
    if (unique.length) {
      await db
        .insert(parentChildren)
        .values(unique.map((parentId) => ({ parentId, childId })));
    }
    return;
  }
  const snapshot = await readLocal();
  snapshot.parentChildren = snapshot.parentChildren.filter(
    (l) => l.childId !== childId,
  );
  for (const parentId of unique) {
    snapshot.parentChildren.push({ parentId, childId });
  }
  await writeLocal(snapshot);
}

export async function saveContact(input: Contact) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    const existing = await db
      .select({ personId: contacts.personId })
      .from(contacts)
      .where(eq(contacts.personId, input.personId))
      .limit(1);
    if (existing.length) {
      await db
        .update(contacts)
        .set(input)
        .where(eq(contacts.personId, input.personId));
    } else {
      await db.insert(contacts).values(input);
    }
    return;
  }
  const snapshot = await readLocal();
  const index = snapshot.contacts.findIndex(
    (c) => c.personId === input.personId,
  );
  if (index >= 0) snapshot.contacts[index] = input;
  else snapshot.contacts.push(input);
  await writeLocal(snapshot);
}

export async function saveResidences(personId: string, rows: Residence[]) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    await db.delete(residences).where(eq(residences.personId, personId));
    if (rows.length) await db.insert(residences).values(rows);
    return;
  }
  const snapshot = await readLocal();
  snapshot.residences = snapshot.residences.filter((r) => r.personId !== personId);
  snapshot.residences.push(...rows);
  await writeLocal(snapshot);
}

export async function savePartnership(input: Partnership) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    const existing = await db
      .select({ id: partnerships.id })
      .from(partnerships)
      .where(eq(partnerships.id, input.id))
      .limit(1);
    if (existing.length) {
      await db.update(partnerships).set(input).where(eq(partnerships.id, input.id));
    } else {
      await db.insert(partnerships).values(input);
    }
    return;
  }
  const snapshot = await readLocal();
  const index = snapshot.partnerships.findIndex((u) => u.id === input.id);
  if (index >= 0) snapshot.partnerships[index] = input;
  else snapshot.partnerships.push(input);
  await writeLocal(snapshot);
}

export async function getProfile(userId: string) {
  const snapshot = await getSnapshot();
  return snapshot.profiles.find((p) => p.userId === userId) ?? null;
}

function profileRow(input: Profile) {
  const personId = input.personId?.trim() ? input.personId.trim() : null;
  const email = input.email?.trim() ? input.email.trim() : null;
  return {
    userId: input.userId,
    personId,
    role: input.role,
    email,
  };
}

export async function upsertProfile(input: Profile) {
  const row = profileRow(input);
  if (isDatabaseConfigured()) {
    const db = getDb();
    const values = {
      userId: row.userId,
      role: row.role,
      ...(row.email ? { email: row.email } : {}),
      ...(row.personId ? { personId: row.personId } : {}),
    };
    await db
      .insert(profiles)
      .values(values)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          role: row.role,
          ...(row.email ? { email: row.email } : {}),
          ...(row.personId ? { personId: row.personId } : {}),
        },
      });
    return;
  }
  const snapshot = await readLocal();
  const index = snapshot.profiles.findIndex((p) => p.userId === row.userId);
  if (index >= 0) snapshot.profiles[index] = row;
  else snapshot.profiles.push(row);
  await writeLocal(snapshot);
}

export async function setProfileRole(userId: string, role: Role) {
  const current =
    (await getProfile(userId)) ?? {
      userId,
      personId: null,
      role: "member" as const,
      email: null,
    };
  await upsertProfile({ ...current, role });
}

export type { ParentChild, Partnership, Residence, Sibling };

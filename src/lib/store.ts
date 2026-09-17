import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { eq, isNull, or, sql } from "drizzle-orm";
import { seedSnapshot } from "@/data/seed";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import {
  auditEvents,
  changeRequests,
  committeeInvites,
  contacts,
  parentChildren,
  partnerships,
  people,
  profiles,
  residences,
  siblings,
} from "@/lib/db/schema";
import type {
  AuditEvent,
  ChangeRequest,
  CommitteeInvite,
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
import { defaultAdminPermissions, isRootPerson, parseAdminPermissions } from "@/lib/types";

export { isRootPerson };

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
    globalThis.__familyMemory = normalizeSnapshot(parsed);
    return globalThis.__familyMemory;
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
    headstonePhotoUrl: row.headstonePhotoUrl,
    familysearchId: row.familysearchId,
    notes: row.notes,
  };
}

function toIso(value: Date | string | null | undefined) {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function mapChangeRequest(row: typeof changeRequests.$inferSelect): ChangeRequest {
  return {
    id: row.id,
    submitterUserId: row.submitterUserId,
    submitterEmail: row.submitterEmail,
    personId: row.personId,
    message: row.message,
    photoUrl: row.photoUrl,
    headstonePhotoUrl: row.headstonePhotoUrl,
    status: row.status,
    adminNote: row.adminNote,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    reviewedAt: toIso(row.reviewedAt),
    reviewedBy: row.reviewedBy,
  };
}

function mapAuditEvent(row: typeof auditEvents.$inferSelect): AuditEvent {
  return {
    id: row.id,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    action: row.action,
    entityId: row.entityId,
    entityLabel: row.entityLabel,
    summary: row.summary,
  };
}

function mapInvite(row: typeof committeeInvites.$inferSelect): CommitteeInvite {
  return {
    id: row.id,
    email: row.email,
    invitedByUserId: row.invitedByUserId,
    invitedByEmail: row.invitedByEmail,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    usedAt: toIso(row.usedAt),
  };
}

function mapProfile(row: {
  userId: string;
  personId: string | null;
  role: Role;
  email: string | null;
  permissions?: unknown;
}): Profile {
  return {
    userId: row.userId,
    personId: row.personId,
    role: row.role,
    email: row.email,
    permissions: parseAdminPermissions(row.permissions, row.role),
  };
}

function normalizeSnapshot(snapshot: FamilySnapshot): FamilySnapshot {
  return {
    ...snapshot,
    people: snapshot.people.map((person) => ({
      ...person,
      headstonePhotoUrl: person.headstonePhotoUrl ?? null,
    })),
    profiles: (snapshot.profiles ?? []).map(mapProfile),
    changeRequests: snapshot.changeRequests ?? [],
    auditEvents: snapshot.auditEvents ?? [],
    committeeInvites: snapshot.committeeInvites ?? [],
  };
}

async function ensureAuxTables() {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      actor_user_id TEXT NOT NULL,
      actor_email TEXT,
      action TEXT NOT NULL,
      entity_id TEXT,
      entity_label TEXT NOT NULL,
      summary TEXT NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS committee_invites (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      invited_by_user_id TEXT NOT NULL,
      invited_by_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      used_at TIMESTAMPTZ
    )
  `);
  await db.execute(sql`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions TEXT
  `);
}

async function ensureNeonSeeded() {
  await ensureAuxTables();
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
    await db.insert(profiles).values(
      snapshot.profiles.map((profile) => ({
        ...profile,
        permissions: JSON.stringify(profile.permissions ?? defaultAdminPermissions()),
      })),
    );
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
    requestRows,
  ] = await Promise.all([
    db.select().from(people),
    db.select().from(contacts),
    db.select().from(parentChildren),
    db.select().from(partnerships),
    db.select().from(residences),
    db.select().from(siblings),
    db.select().from(profiles),
    db.select().from(changeRequests),
  ]);

  let auditRows: (typeof auditEvents.$inferSelect)[] = [];
  let inviteRows: (typeof committeeInvites.$inferSelect)[] = [];
  try {
    auditRows = await db.select().from(auditEvents);
  } catch (error) {
    console.error("Could not load audit events", error);
  }
  try {
    inviteRows = await db.select().from(committeeInvites);
  } catch (error) {
    console.error("Could not load committee invites", error);
  }
  return {
    people: peopleRows.map(mapPerson),
    contacts: contactRows,
    parentChildren: parentRows,
    partnerships: partnershipRows,
    residences: residenceRows,
    siblings: siblingRows,
    profiles: profileRows.map(mapProfile),
    changeRequests: requestRows.map(mapChangeRequest),
    auditEvents: auditRows.map(mapAuditEvent),
    committeeInvites: inviteRows.map(mapInvite),
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

export async function deletePartnershipsForPerson(personId: string) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    await db
      .delete(partnerships)
      .where(or(eq(partnerships.personAId, personId), eq(partnerships.personBId, personId)));
    return;
  }
  const snapshot = await readLocal();
  snapshot.partnerships = snapshot.partnerships.filter(
    (union) => union.personAId !== personId && union.personBId !== personId,
  );
  await writeLocal(snapshot);
}

export async function getProfile(userId: string) {
  const snapshot = await getSnapshot();
  return snapshot.profiles.find((p) => p.userId === userId) ?? null;
}

export async function findProfileByEmail(email: string) {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  if (isDatabaseConfigured()) {
    const db = getDb();
    const rows = await db.select().from(profiles);
    const row = rows.find((profile) => {
      const stored = profile.email?.trim().toLowerCase();
      if (stored === needle) return true;
      return profile.userId.trim().toLowerCase() === `email:${needle}`;
    });
    return row ? mapProfile(row) : null;
  }
  const snapshot = await readLocal();
  return (
    snapshot.profiles.find((profile) => {
      const stored = profile.email?.trim().toLowerCase();
      if (stored === needle) return true;
      return profile.userId.trim().toLowerCase() === `email:${needle}`;
    }) ?? null
  );
}

function profileRow(input: Profile): Profile {
  const personId = input.personId?.trim() ? input.personId.trim() : null;
  const email = input.email?.trim() ? input.email.trim() : null;
  return {
    userId: input.userId,
    personId,
    role: input.role,
    email,
    permissions: parseAdminPermissions(input.permissions, input.role),
  };
}

export async function upsertProfile(input: Profile) {
  const row = profileRow(input);
  if (isDatabaseConfigured()) {
    const db = getDb();
    const values = {
      userId: row.userId,
      role: row.role,
      email: row.email,
      personId: row.personId,
      permissions: JSON.stringify(row.permissions),
    };
    await db
      .insert(profiles)
      .values(values)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          role: row.role,
          email: row.email,
          personId: row.personId,
          permissions: JSON.stringify(row.permissions),
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
      permissions: parseAdminPermissions(undefined, "member"),
    };
  await upsertProfile({ ...current, role });
}

function requestRow(input: ChangeRequest) {
  return {
    id: input.id,
    submitterUserId: input.submitterUserId,
    submitterEmail: input.submitterEmail,
    personId: input.personId,
    message: input.message,
    photoUrl: input.photoUrl,
    headstonePhotoUrl: input.headstonePhotoUrl,
    status: input.status,
    adminNote: input.adminNote,
    createdAt: new Date(input.createdAt),
    reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : null,
    reviewedBy: input.reviewedBy,
  };
}

export async function saveChangeRequest(input: ChangeRequest) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    const row = requestRow(input);
    const existing = await db
      .select({ id: changeRequests.id })
      .from(changeRequests)
      .where(eq(changeRequests.id, input.id))
      .limit(1);
    if (existing.length) {
      await db.update(changeRequests).set(row).where(eq(changeRequests.id, input.id));
    } else {
      await db.insert(changeRequests).values(row);
    }
    return;
  }
  const snapshot = await readLocal();
  const index = snapshot.changeRequests.findIndex((item) => item.id === input.id);
  if (index >= 0) snapshot.changeRequests[index] = input;
  else snapshot.changeRequests.push(input);
  await writeLocal(snapshot);
}

export async function getChangeRequest(id: string) {
  const snapshot = await getSnapshot();
  return snapshot.changeRequests.find((item) => item.id === id) ?? null;
}

export async function saveAuditEvent(input: AuditEvent) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    await db.insert(auditEvents).values({
      id: input.id,
      createdAt: new Date(input.createdAt),
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      action: input.action,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      summary: input.summary,
    });
    return;
  }
  const snapshot = await readLocal();
  snapshot.auditEvents.push(input);
  await writeLocal(snapshot);
}

export async function saveCommitteeInvite(input: CommitteeInvite) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    const existing = await db
      .select({ id: committeeInvites.id })
      .from(committeeInvites)
      .where(eq(committeeInvites.id, input.id))
      .limit(1);
    const row = {
      id: input.id,
      email: input.email,
      invitedByUserId: input.invitedByUserId,
      invitedByEmail: input.invitedByEmail,
      createdAt: new Date(input.createdAt),
      usedAt: input.usedAt ? new Date(input.usedAt) : null,
    };
    if (existing.length) {
      await db.update(committeeInvites).set(row).where(eq(committeeInvites.id, input.id));
    } else {
      await db.insert(committeeInvites).values(row);
    }
    return;
  }
  const snapshot = await readLocal();
  const index = snapshot.committeeInvites.findIndex((item) => item.id === input.id);
  if (index >= 0) snapshot.committeeInvites[index] = input;
  else snapshot.committeeInvites.push(input);
  await writeLocal(snapshot);
}

export async function findPendingInvite(email: string) {
  const needle = email.trim().toLowerCase();
  if (isDatabaseConfigured()) {
    const db = getDb();
    const rows = await db
      .select()
      .from(committeeInvites)
      .where(isNull(committeeInvites.usedAt));
    const row = rows.find((item) => item.email.trim().toLowerCase() === needle);
    return row ? mapInvite(row) : null;
  }
  const snapshot = await readLocal();
  return (
    snapshot.committeeInvites.find(
      (invite) => !invite.usedAt && invite.email.trim().toLowerCase() === needle,
    ) ?? null
  );
}

export async function getCommitteeInvite(id: string) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    const rows = await db
      .select()
      .from(committeeInvites)
      .where(eq(committeeInvites.id, id))
      .limit(1);
    return rows[0] ? mapInvite(rows[0]) : null;
  }
  const snapshot = await readLocal();
  return snapshot.committeeInvites.find((invite) => invite.id === id) ?? null;
}

export async function deleteCommitteeInvite(id: string) {
  if (isDatabaseConfigured()) {
    const db = getDb();
    await db.delete(committeeInvites).where(eq(committeeInvites.id, id));
    return;
  }
  const snapshot = await readLocal();
  snapshot.committeeInvites = snapshot.committeeInvites.filter(
    (invite) => invite.id !== id,
  );
  await writeLocal(snapshot);
}

export async function deletePendingInvitesForEmail(email: string) {
  const needle = email.trim().toLowerCase();
  if (isDatabaseConfigured()) {
    const db = getDb();
    const rows = await db
      .select()
      .from(committeeInvites)
      .where(isNull(committeeInvites.usedAt));
    for (const row of rows) {
      if (row.email.trim().toLowerCase() === needle) {
        await db.delete(committeeInvites).where(eq(committeeInvites.id, row.id));
      }
    }
    return;
  }
  const snapshot = await readLocal();
  snapshot.committeeInvites = snapshot.committeeInvites.filter(
    (invite) =>
      invite.usedAt || invite.email.trim().toLowerCase() !== needle,
  );
  await writeLocal(snapshot);
}

export type { ParentChild, Partnership, Residence, Sibling };

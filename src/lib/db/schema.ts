import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  givenName: text("given_name").notNull(),
  surname: text("surname").notNull().default(""),
  nickname: text("nickname"),
  suffix: text("suffix"),
  photoUrl: text("photo_url"),
  birthDate: text("birth_date"),
  birthPlace: text("birth_place"),
  deathDate: text("death_date"),
  isDeceased: boolean("is_deceased").notNull().default(false),
  headstoneLocation: text("headstone_location"),
  headstonePhotoUrl: text("headstone_photo_url"),
  familysearchId: text("familysearch_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  personId: text("person_id")
    .primaryKey()
    .references(() => people.id, { onDelete: "cascade" }),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  shareAddress: boolean("share_address").notNull().default(false),
  sharePhone: boolean("share_phone").notNull().default(false),
  shareEmail: boolean("share_email").notNull().default(false),
});

export const parentChildren = pgTable(
  "parent_children",
  {
    parentId: text("parent_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    childId: text("child_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.parentId, table.childId] })],
);

export const partnerships = pgTable("partnerships", {
  id: text("id").primaryKey(),
  personAId: text("person_a_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  personBId: text("person_b_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  startDate: text("start_date"),
  place: text("place"),
  notes: text("notes"),
});

export const residences = pgTable("residences", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  year: text("year"),
  place: text("place").notNull(),
});

export const siblings = pgTable(
  "siblings",
  {
    personAId: text("person_a_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    personBId: text("person_b_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.personAId, table.personBId] })],
);

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  personId: text("person_id").references(() => people.id, {
    onDelete: "set null",
  }),
  role: text("role").$type<"member" | "admin" | "super_admin">().notNull().default("member"),
  email: text("email"),
});

export const changeRequests = pgTable("change_requests", {
  id: text("id").primaryKey(),
  submitterUserId: text("submitter_user_id").notNull(),
  submitterEmail: text("submitter_email"),
  personId: text("person_id").references(() => people.id, {
    onDelete: "set null",
  }),
  message: text("message").notNull(),
  photoUrl: text("photo_url"),
  headstonePhotoUrl: text("headstone_photo_url"),
  status: text("status")
    .$type<"pending" | "approved" | "rejected">()
    .notNull()
    .default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  actorUserId: text("actor_user_id").notNull(),
  actorEmail: text("actor_email"),
  action: text("action")
    .$type<
      | "person.create"
      | "person.update"
      | "person.delete"
      | "contact.update"
      | "request.approve"
      | "request.reject"
      | "role.change"
    >()
    .notNull(),
  entityId: text("entity_id"),
  entityLabel: text("entity_label").notNull(),
  summary: text("summary").notNull(),
});

export const committeeInvites = pgTable("committee_invites", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  invitedByUserId: text("invited_by_user_id").notNull(),
  invitedByEmail: text("invited_by_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

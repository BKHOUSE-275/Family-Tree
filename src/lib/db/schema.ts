import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  givenName: text("given_name").notNull(),
  surname: text("surname").notNull().default(""),
  maidenName: text("maiden_name"),
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
  showPhoto: boolean("show_photo").notNull().default(true),
  showMaidenName: boolean("show_maiden_name").notNull().default(true),
  showBirthDate: boolean("show_birth_date").notNull().default(true),
  showBirthPlace: boolean("show_birth_place").notNull().default(true),
  showDeathDate: boolean("show_death_date").notNull().default(true),
  showHeadstone: boolean("show_headstone").notNull().default(true),
  showNotes: boolean("show_notes").notNull().default(true),
  showResidences: boolean("show_residences").notNull().default(true),
  showMarriage: boolean("show_marriage").notNull().default(true),
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
  permissions: text("permissions"),
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
      | "request.submit"
      | "request.approve"
      | "request.reject"
      | "profile.link"
      | "role.change"
      | "album.create"
      | "album.update"
      | "album.delete"
      | "gallery.remove"
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

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date"),
  coverItemId: text("cover_item_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: text("id").primaryKey(),
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"photo" | "video">().notNull(),
    url: text("url").notNull(),
    displayUrl: text("display_url").notNull(),
    thumbUrl: text("thumb_url"),
    contentType: text("content_type").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    caption: text("caption"),
    takenDate: text("taken_date"),
    uploaderUserId: text("uploader_user_id"),
    uploaderName: text("uploader_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("gallery_items_album_idx").on(table.albumId, table.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

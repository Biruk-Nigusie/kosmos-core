import * as p from "drizzle-orm/pg-core";
//type script  contract IDE will know what fields  are available when i read device_info from db.
import { sql } from "drizzle-orm";
import { DeviceMetadata, UserPreferences } from "../types";
export const tokenTypeEnum = p.pgEnum("token_type", [
  "email_verification",
  "password_reset",
]);
export const systemRoleEnum = p.pgEnum("system_role", ["user", "admin"]);
export const permissionLevelEnum = p.pgEnum("permission_level", [
  "owner",
  "editor",
  "viewer",
]);
export const ActionEnum = p.pgEnum("user_actions", [
  "create",
  "update",
  "delete",
  "share",
]);
export const EntityEnum = p.pgEnum("action_on", [
  "note",
  "folder",
  "user_profile",
  "setting",
]);
export const statusEnum = p.pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
]);
export const stageEnum = p.pgEnum("status", ["draft", "published", "archived"]);
export const noteTypeEnum = p.pgEnum("note_type", ["document", "whiteboard"]);
export const users = p.pgTable(
  "users",
  {
    //using UUID prevents ID Enumeration(malicious user guesses the next user's ID)
    id: p.uuid("id").primaryKey().defaultRandom(),
    email: p.varchar("email", { length: 255 }).unique().notNull(),
    password_hash: p.varchar("password_hash", { length: 255 }).notNull(),
    is_verified: p.boolean("is_verified").default(false),
    role: systemRoleEnum("role").default("user").notNull(),
    created_at: p.timestamp("created_at").defaultNow().notNull(),
    updated_at: p.timestamp("updated_at").defaultNow().notNull(),
  },
  //index
  (table) => [
    //vital for performance search on login attempt
    p.index("email_idx").on(table.email),
  ],
);
//for tracking active logins
export const user_sessions = p.pgTable(
  "user_sessions",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    user_id: p
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    refresh_token: p.text("refresh_token").notNull(),
    //accept any valid json structure(binary json format), searchable and efficient
    device_info: p.jsonb("device_info").$type<DeviceMetadata>(),
    last_active: p.timestamp("last_active").defaultNow().notNull(),
    expires_at: p.timestamp("expires_at").notNull(),
    created_at: p.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    p.index("refresh_token_idx").on(table.refresh_token),
    p.index("user_id_idx").on(table.user_id),
  ],
);
export const password_resets = p.pgTable("password_resets", {
  id: p.uuid("id").defaultRandom().primaryKey(),
  userId: p
    .uuid("user_id")
    .references(() => users.id)
    .notNull(),
  code: p.text("code").notNull(),
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
  expiresAt: p.timestamp("expires_at").notNull(),
});
export const profiles = p.pgTable("profiles", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  user_id: p
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  display_name: p.varchar("display_name", { length: 100 }),
  avatar_url: p.text("avatar_url"),
  bio: p.text("bio"),
  updated_at: p.timestamp().$onUpdateFn(() => new Date()),
});

export const user_settings = p.pgTable("user_settings", {
  user_id: p
    .uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  notification_enabled: p.boolean("notification_enabled").default(false),
  preferences: p.jsonb("preferences").$type<UserPreferences>(),
  updated_at: p.timestamp().$onUpdateFn(() => new Date()),
});

export const verification_codes = p.pgTable("verification_codes", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  user_id: p
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  code: p.varchar("code", { length: 6 }).notNull(),
  type: tokenTypeEnum("type").notNull(),
  expires_at: p.timestamp("expires_at").notNull(),
  created_at: p.timestamp("created_at").defaultNow().notNull(),
});

export const note_collaborators = p.pgTable(
  "note_collaborators",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    note_id: p
      .uuid("note_id")
      .references(() => notes.id, { onDelete: "cascade" })
      .notNull(),
    user_id: p
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    permission: permissionLevelEnum("permission").notNull(),
  },
  (table) => [
    p.unique("unique_note_user_idx").on(table.note_id, table.user_id),
    p.index("note_user_idx").on(table.note_id, table.user_id),
  ],
);

export const user_activity_logs = p.pgTable("user_activity_logs", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  user_id: p
    .uuid("user_id")
    .references(() => users.id)
    .notNull(),
  action: ActionEnum("action").notNull(),
  entity_type: EntityEnum("entity_type").notNull(),
  entity_id: p.uuid("entity_id").notNull(),
  metadata: p.jsonb(),
  created_at: p.timestamp().defaultNow(),
});
export const note_invitations = p.pgTable(
  "note_invitations",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    note_id: p.uuid("note_id").references(() => notes.id),
    email: p.varchar("email", { length: 255 }),
    invited_by_user_id: p
      .uuid("invited_by_user_id")
      .references(() => users.id)
      .notNull(),
    permission: permissionLevelEnum("permission").notNull(),
    status: statusEnum("status").notNull(),
    expires_at: p.timestamp().notNull(),
    created_at: p.timestamp().notNull().defaultNow(),
  },
  //one note many user invite || one user invited to many notes but user not invited to same note again
  (table) => [p.unique("unique_note_email_idx").on(table.note_id, table.email)],
);

export const folders: any = p.pgTable(
  "folder",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    name: p.varchar("name", { length: 100 }).notNull(),
    parent_folder_id: p
      .uuid("parent_folder_id")
      .references(() => folders.id, { onDelete: "cascade" }),
    //path-based querying using ltree
    path: p.customType<{ data: string }>({ dataType: () => "ltree" })("path"),
    user_id: p
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    created_at: p.timestamp().notNull().defaultNow(),
  },
  //index specifically optimized for hierarchical path searches
  (table) => [p.index("path_gist_idx").using("gist", table.path)],
);

export const notes = p.pgTable(
  "notes",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    folder_id: p
      .uuid("folder_id")
      .references(() => folders.id, { onDelete: "cascade" }),
    user_id: p
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: p.varchar("title", { length: 255 }).notNull(),
    //slung Clean, SEO-friendly, and shareable
    slug: p.varchar("slug", { length: 255 }).notNull(),
    type: noteTypeEnum("type").default("document").notNull(),
    status: stageEnum("status").default("draft").notNull(),
    content: p.jsonb("content"),
    canvas_data: p.jsonb("canvas_data"),
    created_at: p.timestamp().notNull().defaultNow(),
    updated_at: p.timestamp().$onUpdateFn(() => new Date()),
    deleted_at: p.timestamp("deleted_at"),
  },
  (table) => [
    // Slugs should be unique but scoped to the user
    p.unique("user_slug_idx").on(table.user_id, table.slug),
    p
      .index("active_notes_idx")
      .on(table.id)
      .where(sql`deleted_at IS NULL`),
  ],
);

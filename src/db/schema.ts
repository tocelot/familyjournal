import { pgTable, uuid, text, date, timestamp, integer, varchar, pgEnum } from "drizzle-orm/pg-core";

export const childEnum = pgEnum("child", ["asher", "aiden", "family"]);

export const entries = pgTable("entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  child: childEnum("child").notNull(),
  description: text("description").notNull().default(""),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id")
    .references(() => entries.id, { onDelete: "cascade" })
    .notNull(),
  blobUrl: varchar("blob_url", { length: 500 }).notNull(),
  blobPathname: varchar("blob_pathname", { length: 500 }).notNull(),
  mediaType: varchar("media_type", { length: 10 }).notNull().default("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

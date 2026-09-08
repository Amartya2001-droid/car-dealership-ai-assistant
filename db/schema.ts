import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  expires: integer("expires").notNull(),
});
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});
export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
});
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
});
export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    scheduledFor: text("scheduled_for").notNull(),
    status: text("status").notNull(),
    payload: text("payload").notNull(),
  },
  (t) => [
    uniqueIndex("appointment_active_slot")
      .on(t.scheduledFor)
      .where(sql`${t.status} IN ('requested','confirmed')`),
  ],
);
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
});

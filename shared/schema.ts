import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey(),
  _id: text("_id").notNull(),
  manufacturer_name: text("manufacturer_name").notNull(),
  name: text("name").notNull(),
  rx_required: text("rx_required"),
  short_composition: text("short_composition"),
  slug: text("slug"),
  brand_name: text("brand_name"),
  power: text("power"),
  category: text("category"),
  mg_id: integer("1mg_id"),
  internal_id: integer("internal_id"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMedicineSchema = createInsertSchema(medicines);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

// Recognition and matching schemas
export const handwritingRecognitionSchema = z.object({
  strokes: z.array(z.array(z.object({
    x: z.number(),
    y: z.number(),
    time: z.number(),
  }))),
});

export const recognitionResultSchema = z.object({
  candidates: z.array(z.object({
    text: z.string(),
    confidence: z.number(),
  })),
});

export const medicineMatchSchema = z.object({
  medicine: z.object({
    id: z.string(),
    name: z.string(),
    brand_name: z.string().nullable(),
    manufacturer_name: z.string(),
    short_composition: z.string().nullable(),
    category: z.string().nullable(),
    rx_required: z.string().nullable(),
  }),
  matchScore: z.number(),
  matchedField: z.string(),
});

export type HandwritingRecognitionRequest = z.infer<typeof handwritingRecognitionSchema>;
export type RecognitionResult = z.infer<typeof recognitionResultSchema>;
export type MedicineMatch = z.infer<typeof medicineMatchSchema>;

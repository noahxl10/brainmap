import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  createdAt: integer("created_at").notNull().default(0),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: integer("created_at").notNull().default(0),
});

export const canvases = pgTable("canvases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  nodes: json("nodes").$type<CanvasNode[]>().notNull().default([]),
  edges: json("edges").$type<CanvasEdge[]>().notNull().default([]),
  viewport: json("viewport").$type<{ x: number; y: number; zoom: number }>().notNull().default({ x: 0, y: 0, zoom: 1 }),
});

// Canvas node type
export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    title: string;
    description: string;
    color: string;
    width?: number;
  };
}

// Canvas edge type
export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  phoneNumber: true,
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).pick({
  phoneNumber: true,
  code: true,
  expiresAt: true,
});

export const loginRequestSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  name: z.string().min(1, "Name is required").optional(),
});

export const verifyCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const insertCanvasSchema = createInsertSchema(canvases).omit({
  id: true,
});

export const updateCanvasSchema = createInsertSchema(canvases).omit({
  id: true,
  userId: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type VerifyCode = z.infer<typeof verifyCodeSchema>;
export type Canvas = typeof canvases.$inferSelect;
export type InsertCanvas = z.infer<typeof insertCanvasSchema>;
export type UpdateCanvas = z.infer<typeof updateCanvasSchema>;

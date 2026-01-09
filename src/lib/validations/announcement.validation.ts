import { z } from "zod";

export const announcementTargetSchema = z.object({
  type: z.enum(["all", "department", "course", "class", "role"]),
  id: z.string().optional(),
  role: z.enum(["student", "professor", "hod"]).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters").max(5000),
  target: announcementTargetSchema,
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  isPinned: z.coerce.boolean().default(false),
  expiresAt: z.string().optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).max(5000).optional(),
  target: announcementTargetSchema.optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  isPinned: z.coerce.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementTargetInput = z.infer<typeof announcementTargetSchema>;

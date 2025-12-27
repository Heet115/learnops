import { z } from "zod";

const ALLOWED_FILE_TYPES = ["pdf", "docx", "doc", "ppt", "pptx", "zip"];

export const createALASchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  subjectOfferingId: z.string().min(1, "Subject offering is required"),
  deadline: z.string().min(1, "Deadline is required"),
  maxMarks: z.coerce.number().min(1, "Max marks must be at least 1").max(100),
  isGroupSubmission: z.coerce.boolean().default(false),
  groupFormation: z.enum(["student", "professor"]).optional(),
  maxGroupSize: z.coerce.number().min(2).max(10).optional(),
  allowedFileTypes: z
    .array(z.string())
    .min(1, "Select at least one file type")
    .default(["pdf"]),
  maxFileSize: z.coerce.number().min(1).max(30).default(30), // In MB
});

export const updateALASchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  deadline: z.string().optional(),
  maxMarks: z.coerce.number().min(1).max(100).optional(),
  isGroupSubmission: z.coerce.boolean().optional(),
  groupFormation: z.enum(["student", "professor"]).optional().nullable(),
  maxGroupSize: z.coerce.number().min(2).max(10).optional().nullable(),
  allowedFileTypes: z.array(z.string()).min(1).optional(),
  maxFileSize: z.coerce.number().min(1).max(30).optional(),
  isLocked: z.boolean().optional(),
});

export const addResourceSchema = z.object({
  alaId: z.string().min(1),
  name: z.string().min(1, "Resource name is required"),
  url: z.string().url("Invalid URL"),
  type: z.string().min(1),
});

export type CreateALAInput = z.infer<typeof createALASchema>;
export type UpdateALAInput = z.infer<typeof updateALASchema>;
export type AddResourceInput = z.infer<typeof addResourceSchema>;

export { ALLOWED_FILE_TYPES };

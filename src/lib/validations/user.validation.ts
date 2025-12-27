import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "hod", "professor", "student"]),
  departmentId: z.string().optional(),
  classId: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(["admin", "hod", "professor", "student"]).optional(),
  departmentId: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

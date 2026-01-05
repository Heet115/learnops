import { z } from "zod";

export const activityActionSchema = z.enum([
  "user_created",
  "user_updated",
  "user_deactivated",
  "user_reactivated",
  "user_deleted",
  "department_created",
  "department_updated",
  "course_created",
  "course_updated",
  "semester_created",
  "semester_updated",
  "subject_created",
  "subject_updated",
  "class_created",
  "class_updated",
  "subject_offering_created",
  "subject_offering_updated",
  "ala_created",
  "ala_updated",
  "ala_deleted",
  "submission_created",
  "submission_updated",
  "submission_graded",
  "submission_rejected",
  "group_created",
  "group_updated",
  "student_assigned",
  "professor_assigned",
]);

export const entityTypeSchema = z.enum([
  "user",
  "department",
  "course",
  "semester",
  "subject",
  "class",
  "subject_offering",
  "ala",
  "submission",
  "group",
]);

export const createActivitySchema = z.object({
  userId: z.string().min(1),
  action: activityActionSchema,
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const getActivitiesSchema = z.object({
  userId: z.string().optional(),
  action: activityActionSchema.optional(),
  entityType: entityTypeSchema.optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  page: z.coerce.number().min(1).optional().default(1),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type GetActivitiesInput = z.input<typeof getActivitiesSchema>;
export type ActivityAction = z.infer<typeof activityActionSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;

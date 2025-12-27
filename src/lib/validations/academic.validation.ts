import { z } from "zod";

// Department
export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10)
    .toUpperCase(),
  hodId: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(10).toUpperCase().optional(),
  hodId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Course
export const createCourseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .toUpperCase(),
  departmentId: z.string().min(1, "Department is required"),
  duration: z.number().min(1, "Duration must be at least 1 year").max(6),
});

export const updateCourseSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(20).toUpperCase().optional(),
  departmentId: z.string().optional(),
  duration: z.number().min(1).max(6).optional(),
  isActive: z.boolean().optional(),
});

// Semester
export const createSemesterSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  number: z.number().min(1, "Semester number must be at least 1").max(12),
  courseId: z.string().min(1, "Course is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateSemesterSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  number: z.number().min(1).max(12).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Subject
export const createSubjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .toUpperCase(),
  semesterId: z.string().min(1, "Semester is required"),
  credits: z.number().min(1, "Credits must be at least 1").max(10),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(20).toUpperCase().optional(),
  semesterId: z.string().optional(),
  credits: z.number().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

// Class
export const createClassSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  semesterId: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required").max(20),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  semesterId: z.string().optional(),
  academicYear: z.string().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

// Subject Offering (Teaching Assignment)
export const createSubjectOfferingSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  professorId: z.string().min(1, "Professor is required"),
  semesterId: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required").max(20),
});

export const updateSubjectOfferingSchema = z.object({
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  professorId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Class Coordinator
export const assignClassCoordinatorSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  professorId: z.string().min(1, "Professor is required"),
  academicYear: z.string().min(1, "Academic year is required").max(20),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSubjectOfferingInput = z.infer<typeof createSubjectOfferingSchema>;
export type UpdateSubjectOfferingInput = z.infer<typeof updateSubjectOfferingSchema>;
export type AssignClassCoordinatorInput = z.infer<typeof assignClassCoordinatorSchema>;

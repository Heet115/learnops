'use server';

import { auth } from '@clerk/nextjs/server';
import { connectDB, Department, Course, Semester, User } from '@/lib/db';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createCourseSchema,
  updateCourseSchema,
  createSemesterSchema,
  updateSemesterSchema,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateCourseInput,
  UpdateCourseInput,
  CreateSemesterInput,
  UpdateSemesterInput,
} from '@/lib/validations/academic.validation';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

// ==================== DEPARTMENTS ====================

export async function createDepartment(input: CreateDepartmentInput) {
  await requireAdmin();
  const validated = createDepartmentSchema.parse(input);
  await connectDB();

  // Convert "none" to undefined for hodId
  const departmentData = {
    ...validated,
    hodId: validated.hodId === 'none' ? undefined : validated.hodId,
  };

  try {
    const department = await Department.create(departmentData);
    revalidatePath('/admin/departments');
    return { success: true, department: JSON.parse(JSON.stringify(department)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: 'Department code already exists' };
    }
    return { success: false, error: 'Failed to create department' };
  }
}

export async function getAllDepartments() {
  await connectDB();
  const departments = await Department.find()
    .populate('hodId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(departments));
}

export async function getDepartmentById(id: string) {
  await connectDB();
  const department = await Department.findById(id)
    .populate('hodId', 'firstName lastName email')
    .lean();
  return department ? JSON.parse(JSON.stringify(department)) : null;
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput) {
  await requireAdmin();
  const validated = updateDepartmentSchema.parse(input);
  await connectDB();

  // Convert "none" to null for hodId (to unset the field)
  const updateData: Record<string, unknown> = { ...validated };
  if (validated.hodId === 'none') {
    updateData.hodId = null;
  }

  try {
    const department = await Department.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePath('/admin/departments');
    return { success: true, department: JSON.parse(JSON.stringify(department)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: 'Department code already exists' };
    }
    return { success: false, error: 'Failed to update department' };
  }
}

export async function deleteDepartment(id: string) {
  await requireAdmin();
  await connectDB();

  // Check if department has courses
  const coursesCount = await Course.countDocuments({ departmentId: id });
  if (coursesCount > 0) {
    return { success: false, error: 'Cannot delete department with existing courses' };
  }

  await Department.findByIdAndDelete(id);
  revalidatePath('/admin/departments');
  return { success: true };
}

export async function getAvailableHODs() {
  await connectDB();
  const hods = await User.find({ role: 'hod', isActive: true })
    .select('_id firstName lastName email')
    .lean();
  return JSON.parse(JSON.stringify(hods));
}

// ==================== COURSES ====================

export async function createCourse(input: CreateCourseInput) {
  await requireAdmin();
  const validated = createCourseSchema.parse(input);
  await connectDB();

  try {
    const course = await Course.create(validated);
    revalidatePath('/admin/courses');
    return { success: true, course: JSON.parse(JSON.stringify(course)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: 'Course code already exists' };
    }
    return { success: false, error: 'Failed to create course' };
  }
}

export async function getAllCourses() {
  await connectDB();
  const courses = await Course.find()
    .populate('departmentId', 'name code')
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(courses));
}

export async function getCoursesByDepartment(departmentId: string) {
  await connectDB();
  const courses = await Course.find({ departmentId, isActive: true })
    .sort({ name: 1 })
    .lean();
  return JSON.parse(JSON.stringify(courses));
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  await requireAdmin();
  const validated = updateCourseSchema.parse(input);
  await connectDB();

  try {
    const course = await Course.findByIdAndUpdate(id, validated, { new: true });
    revalidatePath('/admin/courses');
    return { success: true, course: JSON.parse(JSON.stringify(course)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: 'Course code already exists' };
    }
    return { success: false, error: 'Failed to update course' };
  }
}

export async function deleteCourse(id: string) {
  await requireAdmin();
  await connectDB();

  const semestersCount = await Semester.countDocuments({ courseId: id });
  if (semestersCount > 0) {
    return { success: false, error: 'Cannot delete course with existing semesters' };
  }

  await Course.findByIdAndDelete(id);
  revalidatePath('/admin/courses');
  return { success: true };
}

// ==================== SEMESTERS ====================

export async function createSemester(input: CreateSemesterInput) {
  await requireAdmin();
  const validated = createSemesterSchema.parse(input);
  await connectDB();

  try {
    const semester = await Semester.create({
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });
    revalidatePath('/admin/semesters');
    return { success: true, semester: JSON.parse(JSON.stringify(semester)) };
  } catch (error) {
    console.error('Error creating semester:', error);
    return { success: false, error: 'Failed to create semester' };
  }
}

export async function getAllSemesters() {
  await connectDB();
  const semesters = await Semester.find()
    .populate({
      path: 'courseId',
      select: 'name code departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .sort({ 'courseId.name': 1, number: 1 })
    .lean();
  return JSON.parse(JSON.stringify(semesters));
}

export async function getSemestersByCourse(courseId: string) {
  await connectDB();
  const semesters = await Semester.find({ courseId, isActive: true })
    .sort({ number: 1 })
    .lean();
  return JSON.parse(JSON.stringify(semesters));
}

export async function updateSemester(id: string, input: UpdateSemesterInput) {
  await requireAdmin();
  const validated = updateSemesterSchema.parse(input);
  await connectDB();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.startDate) updateData.startDate = new Date(validated.startDate);
  if (validated.endDate) updateData.endDate = new Date(validated.endDate);

  try {
    const semester = await Semester.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePath('/admin/semesters');
    return { success: true, semester: JSON.parse(JSON.stringify(semester)) };
  } catch (error) {
    console.error('Error updating semester:', error);
    return { success: false, error: 'Failed to update semester' };
  }
}

export async function deleteSemester(id: string) {
  await requireAdmin();
  await connectDB();

  // TODO: Check for subjects/classes before deleting
  await Semester.findByIdAndDelete(id);
  revalidatePath('/admin/semesters');
  return { success: true };
}

// ==================== STATS ====================

export async function getAcademicStats() {
  await connectDB();
  const [departments, courses, semesters] = await Promise.all([
    Department.countDocuments({ isActive: true }),
    Course.countDocuments({ isActive: true }),
    Semester.countDocuments({ isActive: true }),
  ]);
  return { departments, courses, semesters };
}

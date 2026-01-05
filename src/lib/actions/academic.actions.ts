"use server";

import { auth } from "@clerk/nextjs/server";
import {
  connectDB,
  Department,
  Course,
  Semester,
  Subject,
  Class,
  SubjectOffering,
  ClassCoordinator,
  User,
} from "@/lib/db";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createCourseSchema,
  updateCourseSchema,
  createSemesterSchema,
  updateSemesterSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createClassSchema,
  updateClassSchema,
  createSubjectOfferingSchema,
  updateSubjectOfferingSchema,
  assignClassCoordinatorSchema,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateCourseInput,
  UpdateCourseInput,
  CreateSemesterInput,
  UpdateSemesterInput,
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateClassInput,
  UpdateClassInput,
  CreateSubjectOfferingInput,
  UpdateSubjectOfferingInput,
  AssignClassCoordinatorInput,
} from "@/lib/validations/academic.validation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

// ==================== DEPARTMENTS ====================

export async function createDepartment(input: CreateDepartmentInput) {
  await requireAdmin();
  const validated = createDepartmentSchema.parse(input);
  await connectDB();

  // Convert "none" to undefined for hodId
  const hodId = validated.hodId === "none" ? undefined : validated.hodId;
  const departmentData = {
    ...validated,
    hodId,
  };

  try {
    const department = await Department.create(departmentData);

    // Update HOD's departmentId if assigned
    if (hodId) {
      await User.findByIdAndUpdate(hodId, { departmentId: department._id });
    }

    revalidatePath("/admin/departments");
    return {
      success: true,
      department: JSON.parse(JSON.stringify(department)),
    };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Department code already exists" };
    }
    return { success: false, error: "Failed to create department" };
  }
}

export async function getAllDepartments() {
  await connectDB();
  const departments = await Department.find()
    .populate("hodId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(departments));
}

export async function getDepartmentById(id: string) {
  await connectDB();
  const department = await Department.findById(id)
    .populate("hodId", "firstName lastName email")
    .lean();
  return department ? JSON.parse(JSON.stringify(department)) : null;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
) {
  await requireAdmin();
  const validated = updateDepartmentSchema.parse(input);
  await connectDB();

  // Get current department to check for HOD changes
  const currentDepartment = await Department.findById(id);
  const oldHodId = currentDepartment?.hodId?.toString();

  // Convert "none" to null for hodId (to unset the field)
  const updateData: Record<string, unknown> = { ...validated };
  let newHodId: string | null = null;

  if (validated.hodId === "none") {
    updateData.hodId = null;
  } else if (validated.hodId) {
    newHodId = validated.hodId;
  }

  try {
    const department = await Department.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Handle HOD departmentId updates
    if (oldHodId !== newHodId) {
      // Remove departmentId from old HOD
      if (oldHodId) {
        await User.findByIdAndUpdate(oldHodId, { $unset: { departmentId: 1 } });
      }
      // Set departmentId on new HOD
      if (newHodId) {
        await User.findByIdAndUpdate(newHodId, { departmentId: id });
      }
    }

    revalidatePath("/admin/departments");
    return {
      success: true,
      department: JSON.parse(JSON.stringify(department)),
    };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Department code already exists" };
    }
    return { success: false, error: "Failed to update department" };
  }
}

export async function deleteDepartment(id: string) {
  await requireAdmin();
  await connectDB();

  // Check if department has courses
  const coursesCount = await Course.countDocuments({ departmentId: id });
  if (coursesCount > 0) {
    return {
      success: false,
      error: "Cannot delete department with existing courses",
    };
  }

  await Department.findByIdAndDelete(id);
  revalidatePath("/admin/departments");
  return { success: true };
}

export async function getAvailableHODs() {
  await connectDB();
  const hods = await User.find({ role: "hod", isActive: true })
    .select("_id firstName lastName email")
    .lean();
  return JSON.parse(JSON.stringify(hods));
}

// ==================== COURSES ====================

export async function createCourse(input: CreateCourseInput) {
  await requireAdmin();
  const validated = createCourseSchema.parse(input);
  await connectDB();

  const semestersPerYear = validated.semestersPerYear ?? 2;
  const totalSemesters = validated.duration * semestersPerYear;

  try {
    // Create course with calculated totalSemesters
    const course = await Course.create({
      ...validated,
      semestersPerYear,
      totalSemesters,
    });

    // Auto-generate semesters for this course
    const semesterDocs = Array.from({ length: totalSemesters }, (_, i) => ({
      name: `Semester ${i + 1}`,
      number: i + 1,
      courseId: course._id,
      isActive: true,
    }));

    await Semester.insertMany(semesterDocs);

    revalidatePath("/admin/courses");
    revalidatePath("/admin/semesters");
    return {
      success: true,
      course: JSON.parse(JSON.stringify(course)),
      semestersCreated: totalSemesters,
    };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Course code already exists" };
    }
    return { success: false, error: "Failed to create course" };
  }
}

export async function getAllCourses() {
  await connectDB();
  const courses = await Course.find()
    .populate("departmentId", "name code")
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
    revalidatePath("/admin/courses");
    return { success: true, course: JSON.parse(JSON.stringify(course)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Course code already exists" };
    }
    return { success: false, error: "Failed to update course" };
  }
}

export async function deleteCourse(id: string) {
  await requireAdmin();
  await connectDB();

  // Check if any semester has subjects
  const semesters = await Semester.find({ courseId: id }).select("_id");
  const semesterIds = semesters.map((s) => s._id);

  if (semesterIds.length > 0) {
    const subjectsCount = await Subject.countDocuments({
      semesterId: { $in: semesterIds },
    });
    if (subjectsCount > 0) {
      return {
        success: false,
        error: "Cannot delete course with existing subjects in its semesters",
      };
    }
  }

  // Delete all auto-generated semesters for this course
  await Semester.deleteMany({ courseId: id });
  await Course.findByIdAndDelete(id);

  revalidatePath("/admin/courses");
  revalidatePath("/admin/semesters");
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
      startDate: validated.startDate
        ? new Date(validated.startDate)
        : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });
    revalidatePath("/admin/semesters");
    return { success: true, semester: JSON.parse(JSON.stringify(semester)) };
  } catch (error) {
    console.error("Error creating semester:", error);
    return { success: false, error: "Failed to create semester" };
  }
}

export async function getAllSemesters() {
  await connectDB();
  const semesters = await Semester.find()
    .populate({
      path: "courseId",
      select: "name code departmentId",
      populate: { path: "departmentId", select: "name code" },
    })
    .sort({ "courseId.name": 1, number: 1 })
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
    const semester = await Semester.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    revalidatePath("/admin/semesters");
    return { success: true, semester: JSON.parse(JSON.stringify(semester)) };
  } catch (error) {
    console.error("Error updating semester:", error);
    return { success: false, error: "Failed to update semester" };
  }
}

export async function deleteSemester(id: string) {
  await requireAdmin();
  await connectDB();

  // Check for subjects before deleting
  const subjectsCount = await Subject.countDocuments({ semesterId: id });
  if (subjectsCount > 0) {
    return {
      success: false,
      error: "Cannot delete semester with existing subjects",
    };
  }

  await Semester.findByIdAndDelete(id);
  revalidatePath("/admin/semesters");
  return { success: true };
}

// ==================== SUBJECTS ====================

export async function createSubject(input: CreateSubjectInput) {
  await requireAdmin();
  const validated = createSubjectSchema.parse(input);
  await connectDB();

  try {
    const subject = await Subject.create(validated);
    revalidatePath("/admin/subjects");
    return { success: true, subject: JSON.parse(JSON.stringify(subject)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Subject code already exists" };
    }
    return { success: false, error: "Failed to create subject" };
  }
}

export async function getAllSubjects() {
  await connectDB();
  const subjects = await Subject.find()
    .populate({
      path: "semesterId",
      select: "name number courseId",
      populate: {
        path: "courseId",
        select: "name code departmentId",
        populate: { path: "departmentId", select: "name code" },
      },
    })
    .sort({ code: 1 })
    .lean();
  return JSON.parse(JSON.stringify(subjects));
}

export async function getSubjectsBySemester(semesterId: string) {
  await connectDB();
  const subjects = await Subject.find({ semesterId, isActive: true })
    .sort({ name: 1 })
    .lean();
  return JSON.parse(JSON.stringify(subjects));
}

export async function updateSubject(id: string, input: UpdateSubjectInput) {
  await requireAdmin();
  const validated = updateSubjectSchema.parse(input);
  await connectDB();

  try {
    const subject = await Subject.findByIdAndUpdate(id, validated, {
      new: true,
    });
    revalidatePath("/admin/subjects");
    return { success: true, subject: JSON.parse(JSON.stringify(subject)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Subject code already exists" };
    }
    return { success: false, error: "Failed to update subject" };
  }
}

export async function deleteSubject(id: string) {
  await requireAdmin();
  await connectDB();

  // TODO: Check for subject offerings before deleting
  await Subject.findByIdAndDelete(id);
  revalidatePath("/admin/subjects");
  return { success: true, error: null };
}

// ==================== CLASSES ====================

export async function createClass(input: CreateClassInput) {
  await requireAdmin();
  const validated = createClassSchema.parse(input);
  await connectDB();

  try {
    const classDoc = await Class.create(validated);
    revalidatePath("/admin/classes");
    return { success: true, class: JSON.parse(JSON.stringify(classDoc)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return {
        success: false,
        error: "Class already exists for this semester and academic year",
      };
    }
    return { success: false, error: "Failed to create class" };
  }
}

export async function getAllClasses() {
  await connectDB();
  const classes = await Class.find()
    .populate({
      path: "semesterId",
      select: "name number courseId",
      populate: {
        path: "courseId",
        select: "name code departmentId",
        populate: { path: "departmentId", select: "name code" },
      },
    })
    .sort({ academicYear: -1, name: 1 })
    .lean();
  return JSON.parse(JSON.stringify(classes));
}

export async function getClassesBySemester(semesterId: string) {
  await connectDB();
  const classes = await Class.find({ semesterId, isActive: true })
    .sort({ name: 1 })
    .lean();
  return JSON.parse(JSON.stringify(classes));
}

export async function updateClass(id: string, input: UpdateClassInput) {
  await requireAdmin();
  const validated = updateClassSchema.parse(input);
  await connectDB();

  try {
    const classDoc = await Class.findByIdAndUpdate(id, validated, {
      new: true,
    });
    revalidatePath("/admin/classes");
    return { success: true, class: JSON.parse(JSON.stringify(classDoc)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return {
        success: false,
        error: "Class already exists for this semester and academic year",
      };
    }
    return { success: false, error: "Failed to update class" };
  }
}

export async function deleteClass(id: string) {
  await requireAdmin();
  await connectDB();

  // Check for subject offerings before deleting
  const offeringsCount = await SubjectOffering.countDocuments({ classId: id });
  if (offeringsCount > 0) {
    return {
      success: false,
      error: "Cannot delete class with existing subject offerings",
    };
  }

  await Class.findByIdAndDelete(id);
  revalidatePath("/admin/classes");
  return { success: true, error: null };
}

// ==================== SUBJECT OFFERINGS ====================

export async function createSubjectOffering(input: CreateSubjectOfferingInput) {
  await requireAdmin();
  const validated = createSubjectOfferingSchema.parse(input);
  await connectDB();

  try {
    const offering = await SubjectOffering.create(validated);
    revalidatePath("/admin/subject-offerings");
    return { success: true, offering: JSON.parse(JSON.stringify(offering)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return {
        success: false,
        error:
          "This subject is already assigned to this class for this semester",
      };
    }
    return { success: false, error: "Failed to create subject offering" };
  }
}

export async function getAllSubjectOfferings() {
  await connectDB();
  const offerings = await SubjectOffering.find()
    .populate("subjectId", "name code credits")
    .populate({
      path: "classId",
      select: "name academicYear semesterId",
    })
    .populate("professorId", "firstName lastName email")
    .populate({
      path: "semesterId",
      select: "name number courseId",
      populate: {
        path: "courseId",
        select: "name code departmentId",
        populate: { path: "departmentId", select: "name code" },
      },
    })
    .sort({ academicYear: -1, "semesterId.number": 1 })
    .lean();
  return JSON.parse(JSON.stringify(offerings));
}

export async function getSubjectOfferingsByProfessor(professorId: string) {
  await connectDB();
  const offerings = await SubjectOffering.find({ professorId, isActive: true })
    .populate("subjectId", "name code credits")
    .populate("classId", "name academicYear")
    .populate("semesterId", "name number")
    .sort({ academicYear: -1 })
    .lean();
  return JSON.parse(JSON.stringify(offerings));
}

export async function getSubjectOfferingsByClass(classId: string) {
  await connectDB();
  const offerings = await SubjectOffering.find({ classId, isActive: true })
    .populate("subjectId", "name code credits")
    .populate("professorId", "firstName lastName email")
    .lean();
  return JSON.parse(JSON.stringify(offerings));
}

export async function updateSubjectOffering(
  id: string,
  input: UpdateSubjectOfferingInput,
) {
  await requireAdmin();
  const validated = updateSubjectOfferingSchema.parse(input);
  await connectDB();

  try {
    const offering = await SubjectOffering.findByIdAndUpdate(id, validated, {
      new: true,
    });
    revalidatePath("/admin/subject-offerings");
    return { success: true, offering: JSON.parse(JSON.stringify(offering)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return {
        success: false,
        error: "This subject is already assigned to this class",
      };
    }
    return { success: false, error: "Failed to update subject offering" };
  }
}

export async function deleteSubjectOffering(id: string) {
  await requireAdmin();
  await connectDB();

  // TODO: Check for ALAs before deleting
  await SubjectOffering.findByIdAndDelete(id);
  revalidatePath("/admin/subject-offerings");
  return { success: true, error: null };
}

export async function getAvailableProfessors() {
  await connectDB();
  const professors = await User.find({ role: "professor", isActive: true })
    .select("_id firstName lastName email")
    .sort({ firstName: 1 })
    .lean();
  return JSON.parse(JSON.stringify(professors));
}

// ==================== CLASS COORDINATORS ====================

export async function assignClassCoordinator(
  input: AssignClassCoordinatorInput,
) {
  await requireAdmin();
  const validated = assignClassCoordinatorSchema.parse(input);
  await connectDB();

  try {
    // Use upsert to replace existing coordinator for this class/year
    const coordinator = await ClassCoordinator.findOneAndUpdate(
      { classId: validated.classId, academicYear: validated.academicYear },
      { ...validated, isActive: true },
      { upsert: true, new: true },
    );

    revalidatePath("/admin/class-coordinators");
    return {
      success: true,
      coordinator: JSON.parse(JSON.stringify(coordinator)),
    };
  } catch (error) {
    console.error("Error assigning class coordinator:", error);
    return { success: false, error: "Failed to assign class coordinator" };
  }
}

export async function getAllClassCoordinators() {
  await connectDB();
  const coordinators = await ClassCoordinator.find({ isActive: true })
    .populate({
      path: "classId",
      select: "name academicYear semesterId",
      populate: {
        path: "semesterId",
        select: "name number courseId",
        populate: {
          path: "courseId",
          select: "name code departmentId",
          populate: { path: "departmentId", select: "name code" },
        },
      },
    })
    .populate("professorId", "firstName lastName email")
    .sort({ academicYear: -1 })
    .lean();
  return JSON.parse(JSON.stringify(coordinators));
}

export async function getClassCoordinatorByClass(
  classId: string,
  academicYear: string,
) {
  await connectDB();
  const coordinator = await ClassCoordinator.findOne({
    classId,
    academicYear,
    isActive: true,
  })
    .populate("professorId", "firstName lastName email")
    .lean();
  return coordinator ? JSON.parse(JSON.stringify(coordinator)) : null;
}

export async function getClassesByCoordinator(professorId: string) {
  await connectDB();
  const coordinators = await ClassCoordinator.find({
    professorId,
    isActive: true,
  })
    .populate({
      path: "classId",
      select: "name academicYear semesterId",
      populate: {
        path: "semesterId",
        select: "name number courseId",
        populate: { path: "courseId", select: "name code" },
      },
    })
    .sort({ academicYear: -1 })
    .lean();
  return JSON.parse(JSON.stringify(coordinators));
}

export async function removeClassCoordinator(
  classId: string,
  academicYear: string,
) {
  await requireAdmin();
  await connectDB();

  await ClassCoordinator.findOneAndUpdate(
    { classId, academicYear },
    { isActive: false },
  );

  revalidatePath("/admin/class-coordinators");
  return { success: true, error: null };
}

export async function deleteClassCoordinator(id: string) {
  await requireAdmin();
  await connectDB();

  await ClassCoordinator.findByIdAndDelete(id);
  revalidatePath("/admin/class-coordinators");
  return { success: true, error: null };
}

// ==================== STATS ====================

export async function getAcademicStats() {
  await connectDB();
  const [
    departments,
    courses,
    semesters,
    subjects,
    classes,
    offerings,
    coordinators,
  ] = await Promise.all([
    Department.countDocuments({ isActive: true }),
    Course.countDocuments({ isActive: true }),
    Semester.countDocuments({ isActive: true }),
    Subject.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
    SubjectOffering.countDocuments({ isActive: true }),
    ClassCoordinator.countDocuments({ isActive: true }),
  ]);
  return {
    departments,
    courses,
    semesters,
    subjects,
    classes,
    offerings,
    coordinators,
  };
}

// ==================== BULK ACTIONS ====================

// Bulk delete departments
export async function bulkDeleteDepartments(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    // Check if any department has courses
    const coursesCount = await Course.countDocuments({
      departmentId: { $in: ids },
    });
    if (coursesCount > 0) {
      return {
        success: false,
        error: "Some departments have existing courses",
      };
    }

    const result = await Department.deleteMany({ _id: { $in: ids } });
    revalidatePath("/admin/departments");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting departments:", error);
    return { success: false, error: "Failed to delete departments" };
  }
}

// Bulk toggle department status
export async function bulkToggleDepartmentStatus(
  ids: string[],
  isActive: boolean,
) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await Department.updateMany(
      { _id: { $in: ids } },
      { isActive },
    );
    revalidatePath("/admin/departments");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk updating departments:", error);
    return { success: false, error: "Failed to update departments" };
  }
}

// Bulk delete courses
export async function bulkDeleteCourses(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    // Check for semesters with subjects
    const semesters = await Semester.find({ courseId: { $in: ids } }).select(
      "_id",
    );
    const semesterIds = semesters.map((s) => s._id);

    if (semesterIds.length > 0) {
      const subjectsCount = await Subject.countDocuments({
        semesterId: { $in: semesterIds },
      });
      if (subjectsCount > 0) {
        return {
          success: false,
          error: "Some courses have subjects in their semesters",
        };
      }
    }

    // Delete semesters first
    await Semester.deleteMany({ courseId: { $in: ids } });
    const result = await Course.deleteMany({ _id: { $in: ids } });

    revalidatePath("/admin/courses");
    revalidatePath("/admin/semesters");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting courses:", error);
    return { success: false, error: "Failed to delete courses" };
  }
}

// Bulk toggle course status
export async function bulkToggleCourseStatus(ids: string[], isActive: boolean) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await Course.updateMany({ _id: { $in: ids } }, { isActive });
    revalidatePath("/admin/courses");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk updating courses:", error);
    return { success: false, error: "Failed to update courses" };
  }
}

// Bulk delete subjects
export async function bulkDeleteSubjects(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    // Check for subject offerings
    const offeringsCount = await SubjectOffering.countDocuments({
      subjectId: { $in: ids },
    });
    if (offeringsCount > 0) {
      return { success: false, error: "Some subjects have existing offerings" };
    }

    const result = await Subject.deleteMany({ _id: { $in: ids } });
    revalidatePath("/admin/subjects");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting subjects:", error);
    return { success: false, error: "Failed to delete subjects" };
  }
}

// Bulk toggle subject status
export async function bulkToggleSubjectStatus(
  ids: string[],
  isActive: boolean,
) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await Subject.updateMany(
      { _id: { $in: ids } },
      { isActive },
    );
    revalidatePath("/admin/subjects");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk updating subjects:", error);
    return { success: false, error: "Failed to update subjects" };
  }
}

// Bulk delete classes
export async function bulkDeleteClasses(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    // Check for subject offerings
    const offeringsCount = await SubjectOffering.countDocuments({
      classId: { $in: ids },
    });
    if (offeringsCount > 0) {
      return {
        success: false,
        error: "Some classes have existing subject offerings",
      };
    }

    const result = await Class.deleteMany({ _id: { $in: ids } });
    revalidatePath("/admin/classes");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting classes:", error);
    return { success: false, error: "Failed to delete classes" };
  }
}

// Bulk toggle class status
export async function bulkToggleClassStatus(ids: string[], isActive: boolean) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await Class.updateMany({ _id: { $in: ids } }, { isActive });
    revalidatePath("/admin/classes");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk updating classes:", error);
    return { success: false, error: "Failed to update classes" };
  }
}

// Bulk delete subject offerings
export async function bulkDeleteSubjectOfferings(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await SubjectOffering.deleteMany({ _id: { $in: ids } });
    revalidatePath("/admin/subject-offerings");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting subject offerings:", error);
    return { success: false, error: "Failed to delete subject offerings" };
  }
}

// Bulk toggle subject offering status
export async function bulkToggleSubjectOfferingStatus(
  ids: string[],
  isActive: boolean,
) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await SubjectOffering.updateMany(
      { _id: { $in: ids } },
      { isActive },
    );
    revalidatePath("/admin/subject-offerings");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk updating subject offerings:", error);
    return { success: false, error: "Failed to update subject offerings" };
  }
}

// Bulk delete class coordinators
export async function bulkDeleteClassCoordinators(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await ClassCoordinator.deleteMany({ _id: { $in: ids } });
    revalidatePath("/admin/class-coordinators");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting class coordinators:", error);
    return { success: false, error: "Failed to delete class coordinators" };
  }
}

// Bulk delete semesters
export async function bulkDeleteSemesters(ids: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    // Check for subjects
    const subjectsCount = await Subject.countDocuments({
      semesterId: { $in: ids },
    });
    if (subjectsCount > 0) {
      return { success: false, error: "Some semesters have existing subjects" };
    }

    const result = await Semester.deleteMany({ _id: { $in: ids } });
    revalidatePath("/admin/semesters");
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Error bulk deleting semesters:", error);
    return { success: false, error: "Failed to delete semesters" };
  }
}

// Bulk toggle semester status
export async function bulkToggleSemesterStatus(
  ids: string[],
  isActive: boolean,
) {
  await requireAdmin();
  await connectDB();

  try {
    const result = await Semester.updateMany(
      { _id: { $in: ids } },
      { isActive },
    );
    revalidatePath("/admin/semesters");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk updating semesters:", error);
    return { success: false, error: "Failed to update semesters" };
  }
}

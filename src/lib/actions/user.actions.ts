"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB, User, IUser, Class, Semester, Course } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to get departmentId from classId by traversing the hierarchy
async function getDepartmentIdFromClass(
  classId: string,
): Promise<string | null> {
  const classDoc = await Class.findById(classId).lean();
  if (!classDoc) return null;

  const semester = await Semester.findById(classDoc.semesterId).lean();
  if (!semester) return null;

  const course = await Course.findById(semester.courseId).lean();
  if (!course) return null;

  return course.departmentId?.toString() || null;
}

export async function getCurrentUserFromDB(): Promise<IUser | null> {
  const { userId } = await auth();

  if (!userId) return null;

  await connectDB();

  const user = await User.findOne({ clerkId: userId, isActive: true });
  return user;
}

export async function getUserByClerkId(clerkId: string): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ clerkId, isActive: true });
}

export async function getUsersByRole(role: string): Promise<IUser[]> {
  await connectDB();
  return User.find({ role, isActive: true }).sort({ createdAt: -1 });
}

export async function updateUserDepartment(
  userId: string,
  departmentId: string,
): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { departmentId },
    { new: true },
  );

  revalidatePath("/admin/users");
  return user;
}

export async function updateUserClass(
  userId: string,
  classId: string,
): Promise<IUser | null> {
  await connectDB();

  const departmentId = await getDepartmentIdFromClass(classId);
  const updateData = departmentId ? { classId, departmentId } : { classId };

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

  revalidatePath("/admin/users");
  revalidatePath("/admin/student-assignments");
  return user;
}

export async function assignStudentToClass(
  studentId: string,
  classId: string | null,
) {
  await connectDB();

  try {
    let updateData: Record<string, unknown>;

    if (classId) {
      const departmentId = await getDepartmentIdFromClass(classId);
      updateData = departmentId ? { classId, departmentId } : { classId };
    } else {
      updateData = { $unset: { classId: 1, departmentId: 1 } };
    }

    const student = await User.findByIdAndUpdate(studentId, updateData, {
      new: true,
    });

    revalidatePath("/admin/student-assignments");
    return { success: true, student: JSON.parse(JSON.stringify(student)) };
  } catch (error) {
    console.error("Error assigning student to class:", error);
    return { success: false, error: "Failed to assign student to class" };
  }
}

export async function bulkAssignStudentsToClass(
  studentIds: string[],
  classId: string,
) {
  await connectDB();

  try {
    const departmentId = await getDepartmentIdFromClass(classId);
    const updateData = departmentId ? { classId, departmentId } : { classId };

    await User.updateMany(
      { _id: { $in: studentIds }, role: "student" },
      updateData,
    );

    revalidatePath("/admin/student-assignments");
    return { success: true };
  } catch (error) {
    console.error("Error bulk assigning students:", error);
    return { success: false, error: "Failed to assign students to class" };
  }
}

export async function removeStudentFromClass(studentId: string) {
  await connectDB();

  try {
    const student = await User.findByIdAndUpdate(
      studentId,
      { $unset: { classId: 1, departmentId: 1 } },
      { new: true },
    );

    revalidatePath("/admin/student-assignments");
    return { success: true, student: JSON.parse(JSON.stringify(student)) };
  } catch (error) {
    console.error("Error removing student from class:", error);
    return { success: false, error: "Failed to remove student from class" };
  }
}

export async function getAllStudents() {
  await connectDB();
  const students = await User.find({ role: "student", isActive: true })
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
    .sort({ firstName: 1, lastName: 1 })
    .lean();
  return JSON.parse(JSON.stringify(students));
}

export async function getStudentsByClass(classId: string) {
  await connectDB();
  const students = await User.find({ role: "student", classId, isActive: true })
    .select("_id firstName lastName email")
    .sort({ firstName: 1, lastName: 1 })
    .lean();
  return JSON.parse(JSON.stringify(students));
}

export async function getUnassignedStudents() {
  await connectDB();
  const students = await User.find({
    role: "student",
    isActive: true,
    classId: { $exists: false },
  })
    .select("_id firstName lastName email")
    .sort({ firstName: 1, lastName: 1 })
    .lean();
  return JSON.parse(JSON.stringify(students));
}

export async function deactivateUser(userId: string): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true },
  );

  revalidatePath("/admin/users");
  return user;
}

export async function activateUser(userId: string): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true },
  );

  revalidatePath("/admin/users");
  return user;
}

// Bulk remove students from class
export async function bulkRemoveStudentsFromClass(studentIds: string[]) {
  await connectDB();

  try {
    const result = await User.updateMany(
      { _id: { $in: studentIds }, role: "student" },
      { $unset: { classId: 1, departmentId: 1 } },
    );

    revalidatePath("/admin/student-assignments");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk removing students from class:", error);
    return { success: false, error: "Failed to remove students from class" };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB, User, IUser } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

  const user = await User.findByIdAndUpdate(userId, { classId }, { new: true });

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
    const updateData = classId ? { classId } : { $unset: { classId: 1 } };
    const student = await User.findByIdAndUpdate(studentId, updateData, { new: true });
    
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
    await User.updateMany(
      { _id: { $in: studentIds }, role: "student" },
      { classId }
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
      { $unset: { classId: 1 } },
      { new: true }
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
    classId: { $exists: false }
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

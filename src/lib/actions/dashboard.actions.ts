"use server";

import {
  connectDB,
  User,
  ALA,
  Submission,
  SubjectOffering,
  Department,
  Course,
  Semester,
  Subject,
  Class,
} from "@/lib/db";
import { requireRole } from "@/lib/auth";

// ==================== PROFESSOR DASHBOARD ====================

export async function getProfessorDashboardStats() {
  const { userId } = await requireRole(["professor"]);

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) throw new Error("Professor not found");

  // Get professor's subject offerings
  const offerings = await SubjectOffering.find({
    professorId: professor._id,
    isActive: true,
  }).select("_id classId");

  const classIds = [...new Set(offerings.map((o) => o.classId.toString()))];

  // Get ALAs
  const alas = await ALA.find({
    professorId: professor._id,
    isActive: true,
  }).select("_id deadline isLocked");

  const alaIds = alas.map((a) => a._id);
  const now = new Date();

  // Count active ALAs (not locked and deadline not passed)
  const activeALAs = alas.filter(
    (a) => !a.isLocked && new Date(a.deadline) > now,
  ).length;

  // Get student count in professor's classes
  const studentCount = await User.countDocuments({
    role: "student",
    classId: { $in: classIds },
    isActive: true,
  });

  // Get submission stats
  const [pending, graded] = await Promise.all([
    Submission.countDocuments({ alaId: { $in: alaIds }, status: "submitted" }),
    Submission.countDocuments({ alaId: { $in: alaIds }, status: "graded" }),
  ]);

  return {
    activeALAs,
    studentCount,
    pendingSubmissions: pending,
    gradedThisMonth: graded,
  };
}

export async function getProfessorRecentSubmissions() {
  const { userId } = await requireRole(["professor"]);

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) throw new Error("Professor not found");

  const alas = await ALA.find({ professorId: professor._id }).select("_id");
  const alaIds = alas.map((a) => a._id);

  const submissions = await Submission.find({
    alaId: { $in: alaIds },
    status: "submitted",
  })
    .populate("studentId", "firstName lastName")
    .populate("alaId", "title")
    .sort({ submittedAt: -1 })
    .limit(5)
    .lean();

  return JSON.parse(JSON.stringify(submissions));
}

export async function getProfessorSubjects() {
  const { userId } = await requireRole(["professor"]);

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) throw new Error("Professor not found");

  const offerings = await SubjectOffering.find({
    professorId: professor._id,
    isActive: true,
  })
    .populate("subjectId", "name code")
    .populate("classId", "name")
    .limit(5)
    .lean();

  return JSON.parse(JSON.stringify(offerings));
}

// ==================== STUDENT DASHBOARD ====================

export async function getStudentDashboardStats() {
  const { userId } = await requireRole(["student"]);

  await connectDB();
  const student = await User.findOne({ clerkId: userId, isActive: true });
  if (!student || !student.classId) {
    return { pending: 0, dueSoon: 0, submitted: 0, overdue: 0 };
  }

  // Get subject offerings for student's class
  const offerings = await SubjectOffering.find({
    classId: student.classId,
    isActive: true,
  }).select("_id");

  const offeringIds = offerings.map((o) => o._id);

  // Get all ALAs for student's class
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
  }).select("_id deadline isLocked");

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Get student's submissions
  const submissions = await Submission.find({
    studentId: student._id,
  }).select("alaId status");

  const submittedAlaIds = new Set(
    submissions
      .filter((s) => s.status === "submitted" || s.status === "graded")
      .map((s) => s.alaId.toString()),
  );

  // Calculate stats
  let pending = 0;
  let dueSoon = 0;
  let overdue = 0;

  for (const ala of alas) {
    const alaIdStr = ala._id.toString();
    const deadline = new Date(ala.deadline);
    const isSubmitted = submittedAlaIds.has(alaIdStr);

    if (!isSubmitted && !ala.isLocked) {
      if (deadline < now) {
        overdue++;
      } else if (deadline <= threeDaysFromNow) {
        dueSoon++;
        pending++;
      } else {
        pending++;
      }
    }
  }

  const submitted = submissions.filter(
    (s) => s.status === "submitted" || s.status === "graded",
  ).length;

  return { pending, dueSoon, submitted, overdue };
}

export async function getStudentUpcomingDeadlines() {
  const { userId } = await requireRole(["student"]);

  await connectDB();
  const student = await User.findOne({ clerkId: userId, isActive: true });
  if (!student || !student.classId) return [];

  const offerings = await SubjectOffering.find({
    classId: student.classId,
    isActive: true,
  }).select("_id");

  const offeringIds = offerings.map((o) => o._id);
  const now = new Date();

  // Get upcoming ALAs (not submitted, deadline in future)
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
    isLocked: false,
    deadline: { $gt: now },
  })
    .populate({
      path: "subjectOfferingId",
      select: "subjectId",
      populate: { path: "subjectId", select: "name code" },
    })
    .sort({ deadline: 1 })
    .limit(5)
    .lean();

  // Filter out already submitted
  const submissions = await Submission.find({
    studentId: student._id,
    alaId: { $in: alas.map((a) => a._id) },
    status: { $in: ["submitted", "graded"] },
  }).select("alaId");

  const submittedIds = new Set(submissions.map((s) => s.alaId.toString()));
  const upcoming = alas.filter((a) => !submittedIds.has(a._id.toString()));

  return JSON.parse(JSON.stringify(upcoming));
}

export async function getStudentRecentGrades() {
  const { userId } = await requireRole(["student"]);

  await connectDB();
  const student = await User.findOne({ clerkId: userId, isActive: true });
  if (!student) return [];

  const submissions = await Submission.find({
    studentId: student._id,
    status: "graded",
  })
    .populate({
      path: "alaId",
      select: "title maxMarks subjectOfferingId",
      populate: {
        path: "subjectOfferingId",
        select: "subjectId",
        populate: { path: "subjectId", select: "code" },
      },
    })
    .sort({ gradedAt: -1 })
    .limit(5)
    .lean();

  return JSON.parse(JSON.stringify(submissions));
}

// ==================== HOD DASHBOARD ====================

export async function getHodDashboardStats() {
  const { userId } = await requireRole(["hod"]);

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) {
    return {
      professors: 0,
      subjects: 0,
      pendingSubmissions: 0,
      completionRate: 0,
    };
  }

  // Get courses in department
  const courses = await Course.find({
    departmentId: hod.departmentId,
    isActive: true,
  }).select("_id");
  const courseIds = courses.map((c) => c._id);

  // Get semesters in those courses
  const semesters = await Semester.find({
    courseId: { $in: courseIds },
    isActive: true,
  }).select("_id");
  const semesterIds = semesters.map((s) => s._id);

  // Get subjects in those semesters
  const subjects = await Subject.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  }).select("_id");

  // Get professors in department
  const professorCount = await User.countDocuments({
    role: "professor",
    departmentId: hod.departmentId,
    isActive: true,
  });

  // Get subject offerings for department
  const offerings = await SubjectOffering.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  }).select("_id");
  const offeringIds = offerings.map((o) => o._id);

  // Get ALAs in department
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
  }).select("_id");
  const alaIds = alas.map((a) => a._id);

  // Get submission stats
  const [pending, total] = await Promise.all([
    Submission.countDocuments({ alaId: { $in: alaIds }, status: "submitted" }),
    Submission.countDocuments({ alaId: { $in: alaIds } }),
  ]);

  const graded = await Submission.countDocuments({
    alaId: { $in: alaIds },
    status: "graded",
  });

  const completionRate = total > 0 ? Math.round((graded / total) * 100) : 0;

  return {
    professors: professorCount,
    subjects: subjects.length,
    pendingSubmissions: pending,
    completionRate,
  };
}

export async function getHodDepartmentOverview() {
  const { userId } = await requireRole(["hod"]);

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) return { courses: [], classes: [] };

  // Get courses
  const courses = await Course.find({
    departmentId: hod.departmentId,
    isActive: true,
  })
    .select("name code")
    .lean();

  // Get classes
  const courseIds = courses.map((c) => c._id);
  const semesters = await Semester.find({
    courseId: { $in: courseIds },
    isActive: true,
  }).select("_id");
  const semesterIds = semesters.map((s) => s._id);

  const classes = await Class.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  })
    .populate({
      path: "semesterId",
      select: "name courseId",
      populate: { path: "courseId", select: "code" },
    })
    .lean();

  return JSON.parse(JSON.stringify({ courses, classes }));
}

// ==================== ADMIN DASHBOARD (Enhanced) ====================

export async function getAdminDashboardStats() {
  await requireRole(["admin"]);

  await connectDB();

  const [
    totalUsers,
    students,
    professors,
    hods,
    departments,
    courses,
    subjects,
    classes,
    alas,
    submissions,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: "student", isActive: true }),
    User.countDocuments({ role: "professor", isActive: true }),
    User.countDocuments({ role: "hod", isActive: true }),
    Department.countDocuments({ isActive: true }),
    Course.countDocuments({ isActive: true }),
    Subject.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
    ALA.countDocuments({ isActive: true }),
    Submission.countDocuments(),
  ]);

  return {
    users: { total: totalUsers, students, professors, hods },
    academic: { departments, courses, subjects, classes },
    activity: { alas, submissions },
  };
}

export async function getAdminRecentUsers() {
  await requireRole(["admin"]);

  await connectDB();

  const users = await User.find({ isActive: true })
    .select("firstName lastName email role createdAt")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return JSON.parse(JSON.stringify(users));
}

"use server";

import { auth } from "@clerk/nextjs/server";
import {
  connectDB,
  User,
  ALA,
  Submission,
  SubjectOffering,
  Course,
  Semester,
  Subject,
  Class,
} from "@/lib/db";

// Helper to get HOD's department scope
async function getHodScope() {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "hod") throw new Error("Unauthorized");

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) {
    return {
      hod: null,
      courseIds: [],
      semesterIds: [],
      offeringIds: [],
      alaIds: [],
      offerings: [],
    };
  }

  // Get courses in department
  const courses = await Course.find({
    departmentId: hod.departmentId,
    isActive: true,
  }).select("_id");
  const courseIds = courses.map((c) => c._id);

  // Get semesters
  const semesters = await Semester.find({
    courseId: { $in: courseIds },
    isActive: true,
  }).select("_id");
  const semesterIds = semesters.map((s) => s._id);

  // Get subject offerings
  const offerings = await SubjectOffering.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  }).select("_id professorId");
  const offeringIds = offerings.map((o) => o._id);

  // Get ALAs
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
  }).select("_id");
  const alaIds = alas.map((a) => a._id);

  return { hod, courseIds, semesterIds, offeringIds, alaIds, offerings };
}

// Submission trends over time (last 30 days)
export async function getSubmissionTrends() {
  const { alaIds } = await getHodScope();

  // Initialize last 30 days with zeros
  const dateMap = new Map<string, { submitted: number; graded: number }>();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    dateMap.set(key, { submitted: 0, graded: 0 });
  }

  if (alaIds.length === 0) {
    return Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      submitted: counts.submitted,
      graded: counts.graded,
    }));
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const submissions = await Submission.find({
    alaId: { $in: alaIds },
    submittedAt: { $gte: thirtyDaysAgo },
  }).select("submittedAt status");

  submissions.forEach((sub) => {
    if (sub.submittedAt) {
      const key = new Date(sub.submittedAt).toISOString().split("T")[0];
      if (dateMap.has(key)) {
        const current = dateMap.get(key)!;
        current.submitted++;
        if (sub.status === "graded") {
          current.graded++;
        }
      }
    }
  });

  const data = Array.from(dateMap.entries()).map(([date, counts]) => ({
    date,
    submitted: counts.submitted,
    graded: counts.graded,
  }));

  return data;
}

// Professor activity - grading stats
export async function getProfessorActivity() {
  const { alaIds, hod } = await getHodScope();

  if (!hod || !hod.departmentId) {
    return [];
  }

  // Get professors in department
  const professors = await User.find({
    role: "professor",
    departmentId: hod.departmentId,
    isActive: true,
  }).select("_id firstName lastName");

  const professorMap = new Map(
    professors.map((p) => [
      p._id.toString(),
      { name: `${p.firstName} ${p.lastName}`, graded: 0, pending: 0 },
    ]),
  );

  // Get all submissions for department ALAs
  const submissions = await Submission.find({
    alaId: { $in: alaIds },
  })
    .populate({
      path: "alaId",
      select: "professorId",
    })
    .select("status alaId");

  submissions.forEach((sub) => {
    const ala = sub.alaId as unknown as { professorId: { toString(): string } };
    if (ala?.professorId) {
      const profId = ala.professorId.toString();
      if (professorMap.has(profId)) {
        const prof = professorMap.get(profId)!;
        if (sub.status === "graded") {
          prof.graded++;
        } else if (sub.status === "submitted") {
          prof.pending++;
        }
      }
    }
  });

  return Array.from(professorMap.values())
    .filter((p) => p.graded > 0 || p.pending > 0)
    .sort((a, b) => b.graded - a.graded);
}

// Submissions by class
export async function getSubmissionsByClass() {
  const { semesterIds } = await getHodScope();

  if (semesterIds.length === 0) {
    return [];
  }

  const classes = await Class.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  })
    .populate({
      path: "semesterId",
      select: "name courseId",
      populate: { path: "courseId", select: "code" },
    })
    .select("name semesterId");

  const classData = await Promise.all(
    classes.map(async (cls) => {
      // Get students in class
      const studentCount = await User.countDocuments({
        role: "student",
        classId: cls._id,
        isActive: true,
      });

      // Get offerings for this class
      const classOfferings = await SubjectOffering.find({
        classId: cls._id,
        isActive: true,
      }).select("_id");
      const classOfferingIds = classOfferings.map((o) => o._id);

      // Get ALAs for this class
      const classAlas = await ALA.find({
        subjectOfferingId: { $in: classOfferingIds },
        isActive: true,
      }).select("_id");
      const classAlaIds = classAlas.map((a) => a._id);

      // Count submissions
      const [submitted, graded] = await Promise.all([
        Submission.countDocuments({
          alaId: { $in: classAlaIds },
          status: { $in: ["submitted", "graded"] },
        }),
        Submission.countDocuments({
          alaId: { $in: classAlaIds },
          status: "graded",
        }),
      ]);

      const semester = cls.semesterId as unknown as {
        name: string;
        courseId?: { code: string };
      };

      return {
        name: cls.name,
        course: semester?.courseId?.code || "",
        semester: semester?.name || "",
        students: studentCount,
        submitted,
        graded,
        pending: submitted - graded,
      };
    }),
  );

  return classData.filter((c) => c.students > 0);
}

// Subject-wise completion rates
export async function getSubjectCompletion() {
  const { semesterIds } = await getHodScope();

  if (semesterIds.length === 0) {
    return [];
  }

  const subjects = await Subject.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  })
    .populate({
      path: "semesterId",
      select: "name",
    })
    .select("name code semesterId");

  const subjectData = await Promise.all(
    subjects.map(async (subject) => {
      // Get offerings for this subject
      const subjectOfferings = await SubjectOffering.find({
        subjectId: subject._id,
        isActive: true,
      }).select("_id classId");

      if (subjectOfferings.length === 0) {
        return null;
      }

      const offeringIds = subjectOfferings.map((o) => o._id);
      const classIds = [
        ...new Set(subjectOfferings.map((o) => o.classId.toString())),
      ];

      // Get ALAs
      const alas = await ALA.find({
        subjectOfferingId: { $in: offeringIds },
        isActive: true,
      }).select("_id");
      const alaIds = alas.map((a) => a._id);

      if (alaIds.length === 0) {
        return null;
      }

      // Get student count
      const studentCount = await User.countDocuments({
        role: "student",
        classId: { $in: classIds },
        isActive: true,
      });

      // Expected submissions = students * ALAs
      const expectedSubmissions = studentCount * alaIds.length;

      // Actual submissions
      const actualSubmissions = await Submission.countDocuments({
        alaId: { $in: alaIds },
        status: { $in: ["submitted", "graded"] },
      });

      const completionRate =
        expectedSubmissions > 0
          ? Math.round((actualSubmissions / expectedSubmissions) * 100)
          : 0;

      return {
        name: subject.name,
        code: subject.code,
        alas: alaIds.length,
        completionRate,
      };
    }),
  );

  return subjectData.filter((s) => s !== null);
}

// Weekly heatmap data (submissions by day of week and hour)
export async function getSubmissionHeatmap() {
  const { alaIds } = await getHodScope();

  // Initialize heatmap: 7 days x 24 hours
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const emptyData: { day: string; hour: number; count: number }[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    for (let hour = 0; hour < 24; hour++) {
      emptyData.push({ day: days[dayIndex], hour, count: 0 });
    }
  }

  if (alaIds.length === 0) {
    return emptyData;
  }

  const submissions = await Submission.find({
    alaId: { $in: alaIds },
    submittedAt: { $exists: true },
  }).select("submittedAt");

  // Initialize heatmap: 7 days x 24 hours
  const heatmap: number[][] = Array(7)
    .fill(null)
    .map(() => Array(24).fill(0));

  submissions.forEach((sub) => {
    if (sub.submittedAt) {
      const date = new Date(sub.submittedAt);
      const day = date.getDay(); // 0-6 (Sun-Sat)
      const hour = date.getHours(); // 0-23
      heatmap[day][hour]++;
    }
  });

  // Convert to flat array for visualization
  const data: { day: string; hour: number; count: number }[] = [];

  heatmap.forEach((hours, dayIndex) => {
    hours.forEach((count, hour) => {
      data.push({
        day: days[dayIndex],
        hour,
        count,
      });
    });
  });

  return data;
}

// ALA status overview
export async function getALAStatusOverview() {
  const { offeringIds } = await getHodScope();

  if (offeringIds.length === 0) {
    return [];
  }

  const now = new Date();

  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
  })
    .populate({
      path: "subjectOfferingId",
      select: "subjectId classId",
      populate: [
        { path: "subjectId", select: "code name" },
        { path: "classId", select: "name" },
      ],
    })
    .select("title deadline isLocked subjectOfferingId")
    .sort({ deadline: 1 })
    .limit(10);

  const alaData = await Promise.all(
    alas.map(async (ala) => {
      const [submitted, graded, total] = await Promise.all([
        Submission.countDocuments({ alaId: ala._id, status: "submitted" }),
        Submission.countDocuments({ alaId: ala._id, status: "graded" }),
        Submission.countDocuments({ alaId: ala._id }),
      ]);

      const offering = ala.subjectOfferingId as unknown as {
        subjectId?: { code: string; name: string };
        classId?: { name: string };
      };

      const deadline = new Date(ala.deadline);
      const isPast = deadline < now;

      return {
        _id: ala._id.toString(),
        title: ala.title,
        subject: offering?.subjectId?.code || "",
        class: offering?.classId?.name || "",
        deadline: new Date(ala.deadline).toISOString(),
        isLocked: ala.isLocked,
        isPast,
        submitted,
        graded,
        pending: submitted,
        total,
      };
    }),
  );

  return alaData;
}

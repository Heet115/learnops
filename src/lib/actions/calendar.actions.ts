"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB, User, ALA, Submission, SubjectOffering } from "@/lib/db";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  type: "deadline" | "late_deadline" | "submitted" | "graded";
  alaId: string;
  subjectName: string;
  subjectCode: string;
  className?: string;
  status?: "pending" | "submitted" | "graded" | "overdue" | "late";
  marks?: number;
  maxMarks?: number;
  isLate?: boolean;
}

// Get calendar events for student
export async function getStudentCalendarEvents(
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "student") return [];

  await connectDB();
  const student = await User.findOne({ clerkId: userId, isActive: true });
  if (!student || !student.classId) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get subject offerings for student's class
  const offerings = await SubjectOffering.find({
    classId: student.classId,
    isActive: true,
  })
    .populate("subjectId", "name code")
    .lean();

  const offeringIds = offerings.map((o) => o._id);
  const offeringMap = new Map(
    offerings.map((o) => [
      o._id.toString(),
      {
        subjectName: (o.subjectId as { name: string }).name,
        subjectCode: (o.subjectId as { code: string }).code,
      },
    ]),
  );

  // Get ALAs with deadlines in range (including late deadlines)
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
    $or: [
      { deadline: { $gte: start, $lte: end } },
      { lateDeadline: { $gte: start, $lte: end } },
    ],
  }).lean();

  // Get student's submissions
  const alaIds = alas.map((a) => a._id);
  const submissions = await Submission.find({
    alaId: { $in: alaIds },
    studentId: student._id,
  }).lean();

  const submissionMap = new Map(
    submissions.map((s) => [s.alaId.toString(), s]),
  );

  const events: CalendarEvent[] = [];
  const now = new Date();

  for (const ala of alas) {
    const offering = offeringMap.get(ala.subjectOfferingId.toString());
    if (!offering) continue;

    const submission = submissionMap.get(ala._id.toString());
    const deadline = new Date(ala.deadline);
    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;

    // Determine status
    let status: CalendarEvent["status"] = "pending";
    if (submission) {
      if (submission.status === "graded") {
        status = "graded";
      } else {
        status = "submitted";
        // Check if submitted late
        if (
          submission.submittedAt &&
          new Date(submission.submittedAt) > deadline
        ) {
          status = "late";
        }
      }
    } else if (now > deadline) {
      if (lateDeadline && now <= lateDeadline) {
        status = "late"; // Can still submit late
      } else {
        status = "overdue";
      }
    }

    // Add deadline event
    if (deadline >= start && deadline <= end) {
      events.push({
        id: `${ala._id}-deadline`,
        title: ala.title,
        date: ala.deadline.toISOString(),
        type: "deadline",
        alaId: ala._id.toString(),
        subjectName: offering.subjectName,
        subjectCode: offering.subjectCode,
        status,
        maxMarks: ala.maxMarks,
        marks: submission?.marks,
      });
    }

    // Add late deadline event if exists
    if (
      lateDeadline &&
      lateDeadline >= start &&
      lateDeadline <= end &&
      ala.allowLateSubmission
    ) {
      events.push({
        id: `${ala._id}-late-deadline`,
        title: `${ala.title} (Late)`,
        date: lateDeadline.toISOString(),
        type: "late_deadline",
        alaId: ala._id.toString(),
        subjectName: offering.subjectName,
        subjectCode: offering.subjectCode,
        status,
        isLate: true,
      });
    }
  }

  return events;
}

// Get calendar events for professor
export async function getProfessorCalendarEvents(
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "professor") return [];

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get professor's ALAs with deadlines in range
  const alas = await ALA.find({
    professorId: professor._id,
    isActive: true,
    $or: [
      { deadline: { $gte: start, $lte: end } },
      { lateDeadline: { $gte: start, $lte: end } },
    ],
  })
    .populate({
      path: "subjectOfferingId",
      select: "subjectId classId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
      ],
    })
    .lean();

  const events: CalendarEvent[] = [];

  for (const ala of alas) {
    const offering = ala.subjectOfferingId as unknown as {
      subjectId: { name: string; code: string };
      classId: { name: string };
    };

    const deadline = new Date(ala.deadline);
    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;

    // Add deadline event
    if (deadline >= start && deadline <= end) {
      events.push({
        id: `${ala._id}-deadline`,
        title: ala.title,
        date: ala.deadline.toISOString(),
        type: "deadline",
        alaId: ala._id.toString(),
        subjectName: offering.subjectId.name,
        subjectCode: offering.subjectId.code,
        className: offering.classId.name,
        maxMarks: ala.maxMarks,
      });
    }

    // Add late deadline event
    if (
      lateDeadline &&
      lateDeadline >= start &&
      lateDeadline <= end &&
      ala.allowLateSubmission
    ) {
      events.push({
        id: `${ala._id}-late-deadline`,
        title: `${ala.title} (Late Deadline)`,
        date: lateDeadline.toISOString(),
        type: "late_deadline",
        alaId: ala._id.toString(),
        subjectName: offering.subjectId.name,
        subjectCode: offering.subjectId.code,
        className: offering.classId.name,
        isLate: true,
      });
    }
  }

  return events;
}

// Get calendar summary (counts by date)
export async function getCalendarSummary(month: number, year: number) {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId) return {};

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return {};

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  let events: CalendarEvent[] = [];

  if (role === "student") {
    events = await getStudentCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString(),
    );
  } else if (role === "professor") {
    events = await getProfessorCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString(),
    );
  }

  // Group by date
  const summary: Record<string, { count: number; types: string[] }> = {};
  for (const event of events) {
    const dateKey = event.date.split("T")[0];
    if (!summary[dateKey]) {
      summary[dateKey] = { count: 0, types: [] };
    }
    summary[dateKey].count++;
    if (!summary[dateKey].types.includes(event.type)) {
      summary[dateKey].types.push(event.type);
    }
  }

  return summary;
}

// Get upcoming deadlines (next N days)
export async function getUpcomingDeadlines(days: number = 7) {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") return [];

  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const events = await getStudentCalendarEvents(
    now.toISOString(),
    endDate.toISOString(),
  );

  // Filter to only deadlines and sort by date
  return events
    .filter((e) => e.type === "deadline" || e.type === "late_deadline")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

import { NextResponse } from "next/server";
import {
  createDeadlineReminders,
  publishScheduledAnnouncements,
} from "@/lib/actions/notification.actions";

// This endpoint can be called by a cron service (e.g., Vercel Cron, external cron)
// to send deadline reminders to students and publish scheduled announcements
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [remindersResult, announcementsResult] = await Promise.all([
      createDeadlineReminders(),
      publishScheduledAnnouncements(),
    ]);

    return NextResponse.json({
      success: true,
      reminders: remindersResult,
      announcements: announcementsResult,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Failed to run cron job" },
      { status: 500 },
    );
  }
}

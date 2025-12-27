import { NextResponse } from "next/server";
import { createDeadlineReminders } from "@/lib/actions/notification.actions";

// This endpoint can be called by a cron service (e.g., Vercel Cron, external cron)
// to send deadline reminders to students
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createDeadlineReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating deadline reminders:", error);
    return NextResponse.json(
      { error: "Failed to create reminders" },
      { status: 500 },
    );
  }
}

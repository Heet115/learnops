import { auth } from "@clerk/nextjs/server";
import { connectDB, User, Notification } from "@/lib/db";
import { NextRequest } from "next/server";
import { addConnection, removeConnection } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const dbUserId = user._id.toString();

  // Get initial unread count
  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    isRead: false,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add this connection
      addConnection(dbUserId, controller);

      // Send initial connection message with unread count
      const initData = JSON.stringify({
        type: "connected",
        payload: { unreadCount },
      });
      controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        removeConnection(dbUserId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

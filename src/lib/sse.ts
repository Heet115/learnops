// Server-side SSE utilities for sending real-time notifications
// This module provides functions to push notifications to connected clients

import { connectDB, Notification, User } from "@/lib/db";

// In-memory store for SSE connections (per-process)
// In production with multiple instances, use Redis pub/sub
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export function addConnection(
  userId: string,
  controller: ReadableStreamDefaultController,
) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
}

export function removeConnection(
  userId: string,
  controller: ReadableStreamDefaultController,
) {
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.delete(controller);
    if (userConns.size === 0) {
      connections.delete(userId);
    }
  }
}

export function getConnectionCount(userId: string): number {
  return connections.get(userId)?.size || 0;
}

export function hasActiveConnection(userId: string): boolean {
  return getConnectionCount(userId) > 0;
}

// Send a notification to a specific user via SSE
export async function pushNotificationToUser(
  userId: string,
  notification: {
    _id: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: string;
    createdAt: Date | string;
    isRead?: boolean;
  },
) {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return false;
  }

  const data = JSON.stringify({
    type: "notification",
    payload: {
      ...notification,
      isRead: notification.isRead ?? false,
      createdAt:
        notification.createdAt instanceof Date
          ? notification.createdAt.toISOString()
          : notification.createdAt,
    },
  });

  const encoder = new TextEncoder();
  let sent = false;

  userConnections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      sent = true;
    } catch {
      // Connection closed, will be cleaned up on next interaction
    }
  });

  return sent;
}

// Send updated unread count to a user
export async function pushUnreadCountToUser(userId: string, count: number) {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return false;
  }

  const data = JSON.stringify({
    type: "unread_count",
    payload: { count },
  });

  const encoder = new TextEncoder();
  let sent = false;

  userConnections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      sent = true;
    } catch {
      // Connection closed
    }
  });

  return sent;
}

// Create notification and push to user in real-time
export async function createAndPushNotification(data: {
  userId: string;
  type:
    | "new_ala"
    | "deadline_reminder"
    | "submission_graded"
    | "submission_rejected"
    | "system";
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "ala" | "submission";
}) {
  await connectDB();

  // Create notification in DB
  const notification = await Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedId: data.relatedId,
    relatedType: data.relatedType,
    isRead: false,
  });

  // Push to connected clients
  await pushNotificationToUser(data.userId, {
    _id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.relatedId?.toString(),
    relatedType: notification.relatedType,
    createdAt: notification.createdAt,
    isRead: false,
  });

  return notification;
}

// Batch create notifications and push to users
export async function createAndPushNotifications(
  notifications: Array<{
    userId: string;
    type:
      | "new_ala"
      | "deadline_reminder"
      | "submission_graded"
      | "submission_rejected"
      | "system";
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: "ala" | "submission";
  }>,
) {
  await connectDB();

  // Create all notifications in DB
  const created = await Notification.insertMany(
    notifications.map((n) => ({
      ...n,
      isRead: false,
    })),
  );

  // Push to connected clients
  for (let i = 0; i < created.length; i++) {
    const notification = created[i];
    const originalData = notifications[i];

    await pushNotificationToUser(originalData.userId, {
      _id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId?.toString(),
      relatedType: notification.relatedType,
      createdAt: notification.createdAt,
      isRead: false,
    });
  }

  return created;
}

// Get user's DB ID from Clerk ID
export async function getUserDbId(clerkId: string): Promise<string | null> {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true }).select("_id");
  return user?._id.toString() || null;
}

// Export connections map for the SSE route
export { connections };

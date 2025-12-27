import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectDB, User } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const eventType = evt.type;

  await connectDB();

  if (eventType === "user.created") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata,
    } = evt.data;

    const email = email_addresses[0]?.email_address;
    const role = (public_metadata?.role as string) || "student";

    try {
      // Use upsert to handle case where user was already created by admin action
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email,
          firstName: first_name || "",
          lastName: last_name || "",
          role,
          profileImage: image_url,
          isActive: true,
        },
        { upsert: true, new: true },
      );

      return NextResponse.json({ message: "User created" }, { status: 201 });
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }
  }

  if (eventType === "user.updated") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata,
    } = evt.data;

    const email = email_addresses[0]?.email_address;
    const role = (public_metadata?.role as string) || "student";

    try {
      // Use upsert to create user if not exists
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email,
          firstName: first_name || "",
          lastName: last_name || "",
          role,
          profileImage: image_url,
          isActive: true,
        },
        { upsert: true, new: true },
      );

      return NextResponse.json({ message: "User updated" }, { status: 200 });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    try {
      await User.findOneAndUpdate({ clerkId: id }, { isActive: false });

      return NextResponse.json(
        { message: "User deactivated" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error deactivating user:", error);
      return NextResponse.json(
        { error: "Failed to deactivate user" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ message: "Webhook received" }, { status: 200 });
}

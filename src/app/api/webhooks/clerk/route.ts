import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    created_at: number;
    updated_at: number;
  };
};

export async function POST(request: NextRequest) {
  console.log("Clerk webhook received");

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing svix headers");
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await request.text();

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Error occurred" },
      { status: 400 }
    );
  }

  console.log("Webhook verified, processing event:", evt.type);

  // Handle the webhook
  const eventType = evt.type;
  const userData = evt.data;

  if (eventType === "user.created" || eventType === "user.updated") {
    try {
      const primaryEmail = userData.email_addresses.find(
        (email) => email.id === userData.email_addresses[0]?.id
      );

      if (!primaryEmail) {
        console.error("No primary email found");
        return NextResponse.json(
          { error: "No primary email found" },
          { status: 400 }
        );
      }

      const name = userData.first_name && userData.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : userData.first_name || null;

      if (eventType === "user.created") {
        // Create new user
        await db.insert(users).values({
          clerkId: userData.id,
          name,
          email: primaryEmail.email_address,
          image: userData.image_url || null,
          emailVerified: new Date(userData.created_at),
        });
        console.log("User created:", userData.id);
      } else {
        // Update existing user
        await db
          .update(users)
          .set({
            name,
            email: primaryEmail.email_address,
            image: userData.image_url || null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, userData.id));
        console.log("User updated:", userData.id);
      }
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
  } else if (eventType === "user.deleted") {
    try {
      // Delete user and all associated data (cascade will handle related properties)
      await db.delete(users).where(eq(users.clerkId, userData.id));
      console.log("User deleted:", userData.id);
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "Webhook processed" });
}
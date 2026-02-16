import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, properties, users } from "@/db";
import { eq } from "drizzle-orm";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's properties
  let userProperties: Array<{
    id: string;
    street: string;
    streetLine2?: string | null;
    city: string;
    state: string;
    propertyType: string;
    purchasePrice: string;
    landValue: string;
  }> = [];
  try {
    const results = await db
      .select()
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(eq(users.clerkId, user.id));

    userProperties = results.map(row => row.properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    // Continue with empty array
  }

  return (
    <DashboardClient
      user={{
        firstName: user.firstName,
        emailAddresses: user.emailAddresses.map(email => ({
          emailAddress: email.emailAddress
        }))
      }}
      userProperties={userProperties}
    />
  );
}

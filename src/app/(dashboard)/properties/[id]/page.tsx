import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db, properties, users } from "@/db";
import { eq, and } from "drizzle-orm";
import PropertyPageClient from "@/components/property/PropertyPageClient";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const resolvedParams = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the specific property
  let property;
  try {
    const results = await db
      .select()
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(and(
        eq(properties.id, resolvedParams.id),
        eq(users.clerkId, user.id)
      ));

    if (results.length === 0) {
      notFound();
    }

    property = results[0].properties;
  } catch (error) {
    console.error("Error fetching property:", error);
    notFound();
  }

  return (
    <PropertyPageClient
      property={property}
      user={{
        firstName: user.firstName,
        emailAddress: user.emailAddresses[0]?.emailAddress
      }}
    />
  );
}
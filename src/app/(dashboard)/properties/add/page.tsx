import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PropertyWizard from "@/components/property/PropertyWizard";

export default async function AddPropertyPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return <PropertyWizard />;
}
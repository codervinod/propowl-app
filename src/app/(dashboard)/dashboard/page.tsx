import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">PropOwl</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.firstName || user.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome, {user.firstName || "there"}!
          </h2>
          <p className="text-gray-600">
            Manage your rental properties and generate tax reports.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
              <CardDescription>
                You haven&apos;t added any properties yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/properties/add">
                <Button className="w-full">Add Your First Property</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Year 2025</CardTitle>
              <CardDescription>
                Schedule E report not available yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Add properties and transactions to generate your tax report.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your portfolio overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Properties</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Income</span>
                  <span className="font-medium">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Expenses</span>
                  <span className="font-medium">$0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

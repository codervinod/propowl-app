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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🦉</span>
            <h1 className="text-3xl font-bold text-orange-500">PropOwl</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">
              {user.firstName || user.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center">
          <div className="mb-6">
            <span className="text-6xl">🦉</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Welcome, {user.firstName || "there"}!
          </h2>
          <p className="text-lg text-gray-600">
            Manage your rental properties and generate tax reports with ease.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-emerald-200 hover:border-emerald-300 transition-all shadow-md hover:shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-emerald-700 flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                Properties
              </CardTitle>
              <CardDescription className="text-gray-600">
                You haven&apos;t added any properties yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/properties/add">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                  🚀 Add Your First Property
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 hover:border-blue-300 transition-all shadow-md hover:shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Tax Year 2025
              </CardTitle>
              <CardDescription className="text-gray-600">
                Schedule E report not available yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Add properties and transactions to generate your tax report.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-violet-200 hover:border-violet-300 transition-all shadow-md hover:shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-violet-700 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Quick Stats
              </CardTitle>
              <CardDescription className="text-gray-600">Your portfolio overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Properties</span>
                  <span className="font-bold text-violet-600 text-lg">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Income</span>
                  <span className="font-bold text-emerald-600 text-lg">$0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Expenses</span>
                  <span className="font-bold text-red-500 text-lg">$0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

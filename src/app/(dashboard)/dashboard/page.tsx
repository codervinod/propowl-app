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
import { db, properties, users } from "@/db";
import { eq } from "drizzle-orm";
import { Plus, Home, MapPin, DollarSign, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's properties
  let userProperties: Array<{
    id: string;
    street: string;
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

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      single_family: "Single Family",
      condo: "Condo",
      townhouse: "Townhouse",
      multi_family: "Multi-Family",
      apartment: "Apartment",
    };
    return types[type] || type;
  };

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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Your Properties
              </h2>
              <p className="text-lg text-gray-600 mt-1">
                {userProperties.length === 0
                  ? "Get started by adding your first rental property"
                  : `Manage your ${userProperties.length} rental ${userProperties.length === 1 ? 'property' : 'properties'}`
                }
              </p>
            </div>
            <Link href="/properties/add">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>

          {userProperties.length === 0 ? (
            // Empty state
            <Card className="border-2 border-dashed border-gray-300 hover:border-orange-300 transition-all">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties yet</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Add your first rental property to start tracking income, expenses, and generating tax reports.
                </p>
                <Link href="/properties/add">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            // Properties grid
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userProperties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="border hover:border-orange-300 transition-all shadow-md hover:shadow-lg bg-white cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="h-5 w-5 text-orange-500" />
                          <span className="text-lg font-semibold text-gray-800 group-hover:text-orange-600">
                            {getPropertyTypeLabel(property.propertyType)}
                          </span>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Active
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {property.street}, {property.city}, {property.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Purchase Price</span>
                          <p className="font-semibold">{formatCurrency(property.purchasePrice)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Land Value</span>
                          <p className="font-semibold">{formatCurrency(property.landValue)}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="text-center text-sm text-gray-600 group-hover:text-orange-600 transition-colors">
                          <Calendar className="h-4 w-4 mx-auto mb-1" />
                          Manage Tax Data
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {userProperties.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="border border-violet-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-violet-600">{userProperties.length}</p>
                  </div>
                  <Home className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Portfolio Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        userProperties.reduce((sum, p) => sum + parseFloat(p.purchasePrice), 0)
                      )}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tax Year 2024</p>
                    <p className="text-sm text-blue-600 font-medium">Ready to add data</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

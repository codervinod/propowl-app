import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">🦉</span>
            <span className="text-2xl font-bold text-orange-500">PropOwl</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="text-8xl block mb-4">🦉</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
            The wise way to manage rentals
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
            AI-powered rental property accounting that eliminates manual data entry
            and generates <span className="text-emerald-600 font-semibold">tax-ready Schedule E reports</span>.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg text-lg px-8 py-6" asChild>
              <Link href="/signup">🚀 Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 text-lg px-8 py-6" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mt-24 grid md:grid-cols-3 gap-8">
          <Card className="border border-emerald-200 hover:border-emerald-300 transition-all shadow-md hover:shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-emerald-700">
                <span className="text-3xl">📊</span>
                <span>Schedule E Ready</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Generate tax-ready reports with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                All expenses auto-categorized to the correct Schedule E line.
                Export PDF or CSV for TurboTax.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 hover:border-blue-300 transition-all shadow-md hover:shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-700">
                <span className="text-3xl">🏠</span>
                <span>PITI Auto-Split</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Mortgage payment breakdown made easy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Enter your mortgage details once. We automatically split
                Principal, Interest, Taxes, and Insurance.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-violet-200 hover:border-violet-300 transition-all shadow-md hover:shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-violet-700">
                <span className="text-3xl">📈</span>
                <span>Depreciation Calculator</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                IRS mid-month convention built-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                27.5-year residential depreciation calculated automatically
                using correct IRS tables and conventions.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="mt-24 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-orange-50 to-amber-50 shadow-xl border border-orange-200">
            <CardHeader className="pb-6">
              <div className="mb-4">
                <span className="text-6xl">🦉</span>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Ready for tax season?</CardTitle>
              <CardDescription className="text-xl text-gray-600">
                Join the beta and get your 2024 Schedule E ready in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg px-10 py-6 shadow-lg" asChild>
                <Link href="/signup">🎉 Get Started Free</Link>
              </Button>
              <p className="text-gray-500 text-sm mt-4">No credit card required • 30-day free trial</p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦉</span>
              <span className="text-xl font-bold text-orange-500">PropOwl</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 PropOwl. Not tax advice - consult a professional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

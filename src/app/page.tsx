import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦉</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">PropOwl</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            The wise way to manage rentals
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            AI-powered rental property accounting that eliminates manual data entry
            and generates tax-ready Schedule E reports.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span> Schedule E Ready
              </CardTitle>
              <CardDescription>
                Generate tax-ready reports with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                All expenses auto-categorized to the correct Schedule E line.
                Export PDF or CSV for TurboTax.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏠</span> PITI Auto-Split
              </CardTitle>
              <CardDescription>
                Mortgage payment breakdown made easy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Enter your mortgage details once. We automatically split
                Principal, Interest, Taxes, and Insurance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📈</span> Depreciation Calculator
              </CardTitle>
              <CardDescription>
                IRS mid-month convention built-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                27.5-year residential depreciation calculated automatically
                using correct IRS tables and conventions.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="mt-32 text-center">
          <Card className="max-w-2xl mx-auto bg-slate-900 dark:bg-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ready for tax season?</CardTitle>
              <CardDescription className="text-slate-300">
                Join the beta and get your 2024 Schedule E ready in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦉</span>
            <span className="font-semibold text-slate-900 dark:text-white">PropOwl</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2025 PropOwl. Not tax advice - consult a professional.
          </p>
        </div>
      </footer>
    </div>
  );
}

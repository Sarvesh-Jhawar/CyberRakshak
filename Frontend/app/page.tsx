import { Shield, Lock, AlertTriangle, Users } from "lucide-react"
import { ThreatGuardLogo } from "@/components/threatguard-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThreatGuardLogo variant="header" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">ThreatGuard</h1>
                <p className="text-sm text-muted-foreground">Incident & Safety Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="default" className="min-w-[100px]">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="default" className="min-w-[100px]">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-6">Secure Your Digital Life</h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Report cybersecurity incidents, access safety protocols, and stay protected with our comprehensive safety
              portal designed for everyone.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button size="lg" asChild variant="default" className="min-w-[140px]">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" asChild variant="default" className="min-w-[140px]">
                <Link href="/login">Access Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">Comprehensive Cyber Protection</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Incident Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Quickly report phishing, malware, fraud, and other cyber threats with our streamlined reporting
                  system.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-secondary mb-2" />
                <CardTitle>Safety Playbooks</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access step-by-step mitigation guides and best practices for various cybersecurity scenarios.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Secure Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor your incident reports, track resolution status, and view personalized security
                  recommendations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-secondary mb-2" />
                <CardTitle>Expert Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Direct connection to cybersecurity experts for critical incidents and guidance.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-foreground font-semibold">ThreatGuard</span>
            </div>
            <div className="text-sm text-muted-foreground">Secure • Reliable • Enterprise-Grade Protection</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

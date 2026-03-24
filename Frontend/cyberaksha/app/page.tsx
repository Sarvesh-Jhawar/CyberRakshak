import { Shield, Lock, AlertTriangle, Users } from "lucide-react"
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
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Defence Cyber Portal</h1>
                <p className="text-sm text-muted-foreground">Incident & Safety Management</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
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
            <h2 className="text-4xl font-bold text-foreground mb-6">Secure Your Digital Defence</h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Report cybersecurity incidents, access safety protocols, and stay protected with our comprehensive defence
              portal designed for military personnel and their families.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" asChild className="cyber-glow">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
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
            <Card className="cyber-border">
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

            <Card className="cyber-border">
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

            <Card className="cyber-border">
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

            <Card className="cyber-border">
              <CardHeader>
                <Users className="h-8 w-8 text-secondary mb-2" />
                <CardTitle>CERT-Army Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Direct connection to Computer Emergency Response Team for critical incidents and expert guidance.
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
              <span className="text-foreground font-semibold">Defence Cyber Portal</span>
            </div>
            <div className="text-sm text-muted-foreground">Secure • Reliable • Defence-Grade Protection</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

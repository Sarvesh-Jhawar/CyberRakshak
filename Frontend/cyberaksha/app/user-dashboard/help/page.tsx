"use client"

import { useMemo, useState } from "react"
import { UserLayout } from "@/components/dashboard/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, Phone, Mail, ExternalLink, Shield, Clock, Search, MapPin, Building2, AlertTriangle, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { stateHelplines } from "./helpline"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredHelplines = useMemo(() => {
    return stateHelplines.filter((helpline) => helpline.state.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
            <p className="text-muted-foreground">Find emergency contacts, helplines, and resources.</p>
          </div>
        </div>

        {/* Emergency Banner */}
        <Card className="cyber-border border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left md:gap-6">
              <AlertTriangle className="h-12 w-12 flex-shrink-0 text-destructive" />
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-destructive">Emergency Cybersecurity Incident?</h3>
                <p className="mt-1 text-muted-foreground">
                  For immediate assistance, call the National Cyber Crime Reporting Portal. You can also find your
                  specific state's helpline below.
                </p>
              </div>
              <div className="w-full flex-shrink-0 md:w-auto">
                <Button asChild size="lg" className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  <a href="tel:1930">
                    <Phone className="mr-2 h-5 w-5" />
                    Call National Helpline: 1930
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State-wise Helplines */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>State-wise Cyber Crime Helplines</span>
            </CardTitle>
            <CardDescription>Find contact information for cyber crime units in your state or union territory.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by state or UT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHelplines.map((helpline) => (
                <div key={helpline.state} className="border border-border rounded-lg p-4 flex flex-col">
                  <h3 className="font-semibold text-foreground mb-2">{helpline.state}</h3>
                  <div className="space-y-3 text-sm text-muted-foreground flex-grow">
                    <p className="flex items-center"><Phone className="h-4 w-4 mr-2 flex-shrink-0" /> {helpline.helpline}</p>
                    <p className="flex items-center"><Mail className="h-4 w-4 mr-2 flex-shrink-0" /> {helpline.email}</p>
                    <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 flex-shrink-0" /> <a href={helpline.map} target="_blank" rel="noopener noreferrer" className="hover:underline">View on Map</a></p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" className="flex-1"><a href={`tel:${helpline.helpline}`}><Phone className="h-4 w-4 mr-2" /> Call</a></Button>
                    <Button asChild variant="secondary" size="sm" className="flex-1"><a href={`mailto:${helpline.email}`}><Mail className="h-4 w-4 mr-2" /> Email</a></Button>
                  </div>
                </div>
              ))}
            </div>
            {filteredHelplines.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No matching state found for "{searchTerm}".</p>
                <p>Always use the National Helpline <span className="font-bold">1930</span> as a backup.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </UserLayout>
  )
}
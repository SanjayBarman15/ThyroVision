"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, LogOut, Calendar, User } from "lucide-react"
import Link from "next/link"
import NewScanPanel from "@/components/new-scan-panel"

export default function DashboardPage() {
  const [isNewScanOpen, setIsNewScanOpen] = useState(false)

  // Mock patient data
  const patients = [
    {
      id: "1",
      name: "John Smith",
      age: 52,
      gender: "M",
      lastScan: "2024-12-28",
      tirads: "3",
      status: "completed",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      age: 45,
      gender: "F",
      lastScan: "2024-12-20",
      tirads: "2",
      status: "completed",
    },
    {
      id: "3",
      name: "Michael Chen",
      age: 58,
      gender: "M",
      lastScan: "2024-12-15",
      tirads: "4",
      status: "completed",
    },
    {
      id: "4",
      name: "Emma Williams",
      age: 38,
      gender: "F",
      lastScan: "2024-12-10",
      tirads: "2",
      status: "completed",
    },
  ]

  const getTiRADSColor = (level: string) => {
    switch (level) {
      case "1":
      case "2":
        return "bg-green-900/30 text-green-200"
      case "3":
        return "bg-yellow-900/30 text-yellow-200"
      case "4":
      case "5":
        return "bg-red-900/30 text-red-200"
      default:
        return "bg-gray-900/30 text-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ThyroVision</h1>
            <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium text-foreground">Dr. Sarah Miller</p>
              <p className="text-xs text-muted-foreground">Radiology Department</p>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* New Scan Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Recent Patients</h2>
            <p className="text-sm text-muted-foreground">Manage and review patient analyses</p>
          </div>
          <Button
            onClick={() => setIsNewScanOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Scan
          </Button>
        </div>

        {/* Patient List */}
        <div className="space-y-4">
          {patients.map((patient) => (
            <Card key={patient.id} className="border-border bg-card p-6 transition-all hover:border-secondary/50">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Patient Info */}
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-foreground">{patient.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {patient.age}y {patient.gender}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Last scan: {formatDate(patient.lastScan)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TiRADS Badge */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-2">Latest TIRADS</p>
                    <Badge className={`${getTiRADSColor(patient.tirads)} text-base px-3 py-1`}>
                      TR {patient.tirads}
                    </Badge>
                  </div>

                  {/* View Analysis Button */}
                  <Link href={`/analysis/${patient.id}`}>
                    <Button
                      variant="outline"
                      className="border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
                    >
                      View Analysis
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* New Scan Panel */}
      <NewScanPanel isOpen={isNewScanOpen} onClose={() => setIsNewScanOpen(false)} />
    </div>
  )
}

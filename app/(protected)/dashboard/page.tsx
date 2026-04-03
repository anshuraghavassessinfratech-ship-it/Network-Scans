"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Building2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Network,
} from "lucide-react"
import type { DashboardStats } from "@/lib/types"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard")
        const data = await res.json()
        
        if (data.success) {
          setStats(data.data)
        } else {
          setError(data.error || "Failed to fetch dashboard data")
        }
      } catch {
        setError("Failed to fetch dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Total Scans",
      value: stats.totalScans,
      description: "Network scans performed",
      icon: Network,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Verified Scans",
      value: stats.verifiedScans,
      description: `${stats.pendingScans} pending verification`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Scans",
      value: stats.pendingScans,
      description: "Awaiting verification",
      icon: ClipboardCheck,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Centers Scanned",
      value: stats.scansByCenter,
      description: "Unique centers scanned",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Average Systems",
      value: stats.averageSystems,
      description: "Systems detected per scan",
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of network scanning activities and system detections
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        monthlyScans={stats.monthlyScans}
      />

      {/* Recent Network Scans */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
          <CardTitle className="text-lg font-bold">Recent Network Scans</CardTitle>
          <CardDescription>Latest network scanning activities</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Auditor</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Center Code</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Center Name</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">City</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Contact</th>
                  <th className="px-4 py-3 text-center font-bold text-blue-700">Total Systems</th>
                  <th className="px-4 py-3 text-center font-bold text-green-700">Working PCs</th>
                  <th className="px-4 py-3 text-center font-bold text-orange-700">Printers</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Scanned</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No network scans recorded yet
                    </td>
                  </tr>
                ) : (
                  stats.recentScans.map((scan, idx) => (
                    <tr key={scan._id?.toString()} className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-blue-50 transition`}>
                      <td className="px-4 py-3 font-medium">{scan.auditorName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{scan.centerCode}</td>
                      <td className="px-4 py-3 font-medium">{scan.centerName}</td>
                      <td className="px-4 py-3">{scan.city}</td>
                      <td className="px-4 py-3 text-center font-mono text-sm">{scan.contact || "-"}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50">{scan.systemsDetected || scan.systemCount}</td>
                      <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50">
                        {scan.scanDetails?.deviceBreakdown?.pcs || 0}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-orange-600 bg-orange-50">
                        {scan.scanDetails?.deviceBreakdown?.printers || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          scan.status === "verified" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(scan.createdAt || scan.scannedAt).toLocaleDateString()} <br/>
                        {new Date(scan.createdAt || scan.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {stats.recentScans.length > 0 && (
            <div className="px-4 py-4 border-t text-center">
              <Link
                href="/network-scans"
                className="text-sm font-semibold text-primary hover:underline"
              >
                View all network scans →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

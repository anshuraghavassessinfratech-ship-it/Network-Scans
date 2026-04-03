import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    await requireAuth()
    
    const db = await getDb()
    const networkScansCollection = db.collection("network_scans")
    
    // Get total network scans
    const totalScans = await networkScansCollection.countDocuments()
    
    // Get verified vs pending scans
    const verifiedScans = await networkScansCollection.countDocuments({ status: "verified" })
    const pendingScans = await networkScansCollection.countDocuments({ status: "pending" })
    
    // Get average systems detected
    const systemsAgg = await networkScansCollection.aggregate([
      { $group: { _id: null, avgSystems: { $avg: "$systemsDetected" } } }
    ]).toArray()
    const averageSystems = systemsAgg[0]?.avgSystems || 0
    
    // Get recent network scans
    const recentScans = await networkScansCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    
    // Get scan counts by center (if center info available)
    const scansByCenter = await networkScansCollection.aggregate([
      { $group: { _id: "$centerId", count: { $sum: 1 }, latestScan: { $first: "$$ROOT" } } }
    ]).toArray()
    
    // Get monthly scan counts for the past 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyScanAgg = await networkScansCollection.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray()
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyScans = monthlyScanAgg.map((m) => ({
      month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      count: m.count
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        totalScans,
        verifiedScans,
        pendingScans,
        averageSystems: Math.round(averageSystems),
        recentScans,
        scansByCenter: scansByCenter.length,
        monthlyScans,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

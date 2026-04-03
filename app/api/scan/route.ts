import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ExamCenter, ScanLog, AuditRecord } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { centerId, location, deviceInfo } = body
    
    if (!centerId) {
      return NextResponse.json(
        { success: false, error: "Center ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDb()
    const centersCollection = db.collection<ExamCenter>("centers")
    const scanLogsCollection = db.collection<ScanLog>("scan_logs")
    const auditsCollection = db.collection<AuditRecord>("audits")
    
    // Find the center
    const center = await centersCollection.findOne({ centerId })
    
    if (!center) {
      return NextResponse.json(
        { success: false, error: "Center not found" },
        { status: 404 }
      )
    }
    
    // Log the scan
    const scanLog: ScanLog = {
      centerId,
      scannedBy: user.userId,
      scannedAt: new Date(),
      location: location || { latitude: 0, longitude: 0 },
      deviceInfo: deviceInfo || "Unknown",
    }
    
    await scanLogsCollection.insertOne(scanLog)
    
    // Get the latest audit for this center
    const latestAudit = await auditsCollection
      .findOne({ centerId }, { sort: { auditDate: -1 } })
    
    return NextResponse.json({
      success: true,
      data: {
        center,
        latestAudit,
        message: "Center found and scan logged",
      },
    })
  } catch (error) {
    console.error("Scan error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

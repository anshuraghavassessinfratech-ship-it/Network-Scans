import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireApiAuth, requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Interface for network scan data
interface NetworkScanData {
  centerCode: string
  centerName: string
  city: string
  auditorName: string
  contact: string
  systemCount: number
  ipList: string[]
  scanDetails?: {
    totalDevices: number
    localIP: string
    subnet: string
    scannedAt: string
    deviceBreakdown?: {
      pcs: number
      printers: number
      unknown: number
    }
  }
}

interface NetworkScanRecord extends NetworkScanData {
  _id?: ObjectId
  scanId: string
  scannedBy: string
  scannedAt: Date
  status: "pending" | "verified" | "rejected"
}

// POST - Receive scan data from network scanner
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Network scan API called")
    
    let user
    try {
      user = await requireApiAuth(request)
      console.log("✅ Authenticated user:", user.username)
    } catch (authError) {
      console.error("❌ Auth error:", authError.message)
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      )
    }
    
    let body: NetworkScanData
    try {
      body = await request.json()
      console.log("📦 Request body:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!body.centerCode || !body.centerName) {
      return NextResponse.json(
        { success: false, error: "Center code and name are required" },
        { status: 400 }
      )
    }
    
    if (typeof body.systemCount !== "number" || body.systemCount < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid system count" },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(body.ipList)) {
      return NextResponse.json(
        { success: false, error: "IP list must be an array" },
        { status: 400 }
      )
    }
    
    const db = await getDb()
    const scansCollection = db.collection<NetworkScanRecord>("network_scans")
    
    // Generate scan ID
    const scanId = `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    
    // Create scan record
    const scanRecord: NetworkScanRecord = {
      scanId,
      centerCode: body.centerCode,
      centerName: body.centerName,
      city: body.city || "",
      auditorName: body.auditorName || user.name,
      contact: body.contact || "",
      systemCount: body.systemCount,
      ipList: body.ipList,
      scanDetails: body.scanDetails,
      scannedBy: user.userId,
      scannedAt: new Date(),
      status: "pending",
    }
    
    await scansCollection.insertOne(scanRecord)
    
    // Update center with latest scan data if it exists
    const centersCollection = db.collection("centers")
    await centersCollection.updateOne(
      { centerId: body.centerCode },
      {
        $set: {
          lastNetworkScan: {
            scanId,
            systemCount: body.systemCount,
            scannedAt: new Date(),
            scannedBy: user.name,
          },
        },
      }
    )
    
    console.log("✅ Scan data saved successfully:", { scanId, systemCount: body.systemCount })
    
    return NextResponse.json({
      success: true,
      data: {
        scanId,
        systemCount: body.systemCount,
        ipCount: body.ipList.length,
        message: "Network scan data received successfully",
      },
    })
  } catch (error) {
    console.error("❌ Network scan error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// GET - Retrieve scan history for a center
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const centerCode = searchParams.get("centerCode")
    const limit = parseInt(searchParams.get("limit") || "10")
    
    const db = await getDb()
    const scansCollection = db.collection<NetworkScanRecord>("network_scans")
    
    const query: Record<string, unknown> = {}
    if (centerCode) {
      query.centerCode = centerCode
    }
    
    const scans = await scansCollection
      .find(query)
      .sort({ scannedAt: -1 })
      .limit(limit)
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: scans,
    })
  } catch (error) {
    console.error("Get scans error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

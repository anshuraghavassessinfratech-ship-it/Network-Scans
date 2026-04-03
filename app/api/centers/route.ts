import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ExamCenter } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const zone = searchParams.get("zone") || ""
    const status = searchParams.get("status") || ""
    
    const db = await getDb()
    const centersCollection = db.collection<ExamCenter>("centers")
    
    const query: Record<string, unknown> = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { centerId: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ]
    }
    
    if (zone) {
      query.zone = zone
    }
    
    if (status) {
      query.status = status
    }
    
    const total = await centersCollection.countDocuments(query)
    const centers = await centersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: {
        centers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get centers error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"])
    
    const body = await request.json()
    
    const db = await getDb()
    const centersCollection = db.collection<ExamCenter>("centers")
    
    // Check if center ID already exists
    const existing = await centersCollection.findOne({ centerId: body.centerId })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Center ID already exists" },
        { status: 400 }
      )
    }
    
    const center: ExamCenter = {
      centerId: body.centerId,
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zone: body.zone,
      capacity: body.capacity,
      contactPerson: body.contactPerson,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      status: body.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await centersCollection.insertOne(center)
    
    return NextResponse.json({
      success: true,
      data: { ...center, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Create center error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

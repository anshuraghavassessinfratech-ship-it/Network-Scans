import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ExamCenter } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    
    const { id } = await params
    const db = await getDb()
    const centersCollection = db.collection<ExamCenter>("centers")
    
    let center = null
    
    // Try to find by ObjectId first
    if (ObjectId.isValid(id)) {
      center = await centersCollection.findOne({ _id: new ObjectId(id) })
    }
    
    // If not found, try by centerId
    if (!center) {
      center = await centersCollection.findOne({ centerId: id })
    }
    
    if (!center) {
      return NextResponse.json(
        { success: false, error: "Center not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: center,
    })
  } catch (error) {
    console.error("Get center error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["admin"])
    
    const { id } = await params
    const body = await request.json()
    
    const db = await getDb()
    const centersCollection = db.collection<ExamCenter>("centers")
    
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }
    delete updateData._id
    
    const result = await centersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    )
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Center not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Update center error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["admin"])
    
    const { id } = await params
    const db = await getDb()
    const centersCollection = db.collection<ExamCenter>("centers")
    
    const result = await centersCollection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Center not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "Center deleted successfully",
    })
  } catch (error) {
    console.error("Delete center error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

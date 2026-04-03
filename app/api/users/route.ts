import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth, hashPassword } from "@/lib/auth"
import type { User } from "@/lib/types"

export async function GET() {
  try {
    await requireAuth(["admin"])
    
    const db = await getDb()
    const usersCollection = db.collection<User>("users")
    
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Get users error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"])
    
    const body = await request.json()
    
    if (!body.username || !body.password || !body.name || !body.role) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }
    
    const db = await getDb()
    const usersCollection = db.collection<User>("users")
    
    // Check if username already exists
    const existing = await usersCollection.findOne({ username: body.username })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 400 }
      )
    }
    
    const hashedPassword = await hashPassword(body.password)
    
    const user: User = {
      username: body.username,
      password: hashedPassword,
      role: body.role,
      name: body.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await usersCollection.insertOne(user)
    
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      data: { ...userWithoutPassword, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Create user error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

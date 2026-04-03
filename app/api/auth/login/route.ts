import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyPassword, createToken, initializeDefaultAdmin } from "@/lib/auth"
import type { User } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      )
    }
    
    try {
      // Initialize default admin if not exists
      await initializeDefaultAdmin()
    } catch (initError) {
      console.error("Admin initialization error:", initError)
      // Continue even if initialization fails - user might exist
    }
    
    const db = await getDb()
    const usersCollection = db.collection<User>("users")
    
    const user = await usersCollection.findOne({ username })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }
    
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }
    
    const { password: _, ...userWithoutPassword } = user
    const token = await createToken(userWithoutPassword)
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    })
    
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    console.error("❌ Login error:", errorMessage)
    
    // Check if it's a MongoDB connection error
    if (errorMessage.includes("MongoDB") || errorMessage.includes("mongodb")) {
      return NextResponse.json(
        { success: false, error: "Database connection failed. Please try again." },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

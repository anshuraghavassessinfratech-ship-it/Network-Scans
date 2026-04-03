import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getDb } from "./mongodb"
import type { User } from "./types"

const JWT_SECRET_KEY = process.env.JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY || "default-secret-change-me")

// Validate JWT secret at runtime
function validateJwtSecret() {
  if (!JWT_SECRET_KEY || JWT_SECRET_KEY === "your-very-secure-jwt-secret-key-change-this-in-production") {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      throw new Error("JWT_SECRET environment variable must be set to a secure value in production")
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(user: Omit<User, "password">): Promise<string> {
  validateJwtSecret()
  return new SignJWT({
    userId: user._id?.toString(),
    username: user.username,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  validateJwtSecret()
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as {
      userId: string
      username: string
      role: "admin" | "auditor"
      name: string
    }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

export async function requireAuth(allowedRoles?: ("admin" | "auditor")[]) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Unauthorized")
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  
  return user
}

export async function requireApiAuth(request: Request, allowedRoles?: ("admin" | "auditor")[]) {
  try {
    const authHeader = request.headers.get("authorization")

    // Log header presence for debugging
    console.log("🔐 Auth header present:", !!authHeader)
    if (authHeader) {
      console.log("🔐 Auth header starts with Bearer:", authHeader.startsWith("Bearer "))
    }

    if (!authHeader) {
      console.log("❌ No authorization header provided")
      throw new Error("Missing authorization header")
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ Invalid authorization header format:", authHeader.substring(0, 20) + "...")
      throw new Error("Invalid authorization header format. Expected 'Bearer <token>'")
    }

    const token = authHeader.substring(7).trim() // Remove "Bearer " prefix and trim whitespace

    if (!token) {
      console.log("❌ Empty token after Bearer prefix")
      throw new Error("Empty token provided")
    }

    console.log("🔐 Token extracted, length:", token.length)

    // Dev bypass token for local testing (only in development)
    const devToken = process.env.API_DEV_TOKEN || "dev-scan-token"
    const isDev = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "development"

    if (isDev && token === devToken) {
      console.log("✅ Using dev bypass token")
      return {
        userId: "dev",
        username: "dev",
        role: "admin",
        name: "Development Scanner",
      }
    }

    // Verify JWT token
    console.log("🔐 Verifying JWT token...")
    const user = await verifyToken(token)

    if (!user) {
      console.log("❌ JWT verification failed - invalid token")
      throw new Error("Invalid or expired token")
    }

    console.log("✅ JWT verified for user:", user.username, "role:", user.role)

    // Check role permissions if specified
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log("❌ Insufficient permissions. User role:", user.role, "Required:", allowedRoles)
      throw new Error("Insufficient permissions")
    }

    return user

  } catch (error) {
    console.error("❌ requireApiAuth failed:", error.message)
    // Re-throw with the specific error message
    throw error
  }
}

export async function initializeDefaultAdmin() {
  const db = await getDb()
  const usersCollection = db.collection<User>("users")
  
  const existingAdmin = await usersCollection.findOne({ role: "admin" })
  
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("admin123")
    await usersCollection.insertOne({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      name: "System Administrator",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}

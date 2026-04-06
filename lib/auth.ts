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
  const authHeader = request.headers.get("authorization")
  console.log("🔐 Auth header present:", !!authHeader)

  if (!authHeader) {
    console.log("❌ No authorization header provided")
    throw new Error("Missing authorization header")
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.log("❌ Invalid authorization header format:", authHeader.substring(0, 20) + "...")
    throw new Error("Invalid authorization format")
  }

  const token = authHeader.substring(7).trim()
  if (!token) {
    console.log("❌ Empty token after Bearer prefix")
    throw new Error("Missing authorization header")
  }

  console.log("🔐 Incoming token:", token.slice(0, 10) + "...")

  const SCANNER_API_TOKEN = process.env.SCANNER_API_TOKEN
  const isStaticScannerToken = Boolean(SCANNER_API_TOKEN && token === SCANNER_API_TOKEN)
  console.log("🔐 Using static scanner token:", isStaticScannerToken)

  if (isStaticScannerToken) {
    const scannerUser = {
      userId: "scanner",
      username: "scanner-device",
      role: "admin",
      name: "Scanner Device",
    }

    if (allowedRoles && !allowedRoles.includes(scannerUser.role)) {
      console.log("❌ Scanner token does not have required role:", scannerUser.role)
      throw new Error("Insufficient permissions")
    }

    return scannerUser
  }

  console.log("🔐 Falling back to JWT verification")
  const user = await verifyToken(token)

  if (!user) {
    console.log("❌ JWT verification failed - invalid or expired token")
    throw new Error("Invalid or expired token")
  }

  console.log("✅ JWT verified for user:", user.username, "role:", user.role)

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log("❌ Insufficient permissions. User role:", user.role, "Required:", allowedRoles)
    throw new Error("Insufficient permissions")
  }

  return user
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

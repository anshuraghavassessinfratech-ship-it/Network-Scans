import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getDb } from "./mongodb"
import type { User } from "./types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-me")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(user: Omit<User, "password">): Promise<string> {
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
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized")
  }
  
  const token = authHeader.substring(7) // Remove "Bearer " prefix
  
  // Dev bypass token for local testing (do not use in production).
  const devToken = process.env.API_DEV_TOKEN || "dev-scan-token"
  if (process.env.NODE_ENV !== "production" && token === devToken) {
    return {
      userId: "dev",
      username: "dev",
      role: "admin",
      name: "Development Scanner",
    }
  }
  
  const user = await verifyToken(token)
  
  if (!user) {
    throw new Error("Unauthorized")
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
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

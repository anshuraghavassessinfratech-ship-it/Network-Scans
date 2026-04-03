import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error("❌ MONGODB_URI not set in environment variables")
  if (process.env.NODE_ENV === "production") {
    throw new Error("MongoDB URI is required. Set MONGODB_URI in environment variables.")
  }
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// Handle connection errors
const createClientPromise = () => {
  if (!uri) {
    return Promise.reject(new Error("MONGODB_URI not configured"))
  }
  
  const client = new MongoClient(uri, options)
  
  return client.connect()
    .then(() => {
      console.log("✅ MongoDB connected successfully")
      return client
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", {
        message: error.message,
        code: error.code,
        details: error.errmsg
      })
      throw new Error(`MongoDB connection failed: ${error.message}`)
    })
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = createClientPromise()
}

export default clientPromise

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Please set it in .env.local or environment variables.")
  }
  
  try {
    const client = await clientPromise
    const db = client.db("exam_audit_system")
    return db
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Error getting database connection:", errorMessage)
    throw new Error(`Failed to connect to MongoDB: ${errorMessage}`)
  }
}

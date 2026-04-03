import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { AuditRecord } from "@/lib/types"

function calculateScores(data: Partial<AuditRecord>) {
  // Calculate infrastructure score
  const infra = data.infrastructure
  if (!infra) return { infrastructureScore: 0, itScore: 0, complianceScore: 0, overallScore: 0 }
  
  const infraChecks = [
    infra.powerBackup, infra.internetConnectivity, infra.cctv,
    infra.biometricSystem, infra.fireExtinguishers, infra.emergencyExits,
    infra.airConditioning, infra.lighting, infra.seatingArrangement,
    infra.drinkingWater, infra.toiletFacilities
  ]
  const infraScore = (infraChecks.filter(Boolean).length / infraChecks.length) * 100
  
  // Building condition bonus
  const conditionBonus = {
    excellent: 10,
    good: 5,
    fair: 0,
    poor: -10
  }[infra.buildingCondition] || 0
  
  const infrastructureScore = Math.min(100, Math.max(0, infraScore + conditionBonus))
  
  // Calculate IT score
  const it = data.itInfrastructure
  if (!it) return { infrastructureScore, itScore: 0, complianceScore: 0, overallScore: 0 }
  
  const computerRatio = it.totalComputers > 0 ? (it.workingComputers / it.totalComputers) * 40 : 0
  const itChecks = [it.serverRoom, it.ups, it.lan, it.antivirus, it.firewall]
  const itCheckScore = (itChecks.filter(Boolean).length / itChecks.length) * 60
  const itScore = computerRatio + itCheckScore
  
  // Calculate compliance score
  const compliance = data.compliance
  if (!compliance) return { infrastructureScore, itScore, complianceScore: 0, overallScore: 0 }
  
  const complianceChecks = [
    compliance.licensesValid, compliance.staffTrained, compliance.examSoftwareInstalled,
    compliance.mockTestConducted, compliance.dataBackupSystem, compliance.incidentReportingSystem
  ]
  const complianceScore = (complianceChecks.filter(Boolean).length / complianceChecks.length) * 100
  
  // Overall score (weighted average)
  const overallScore = Math.round(
    (infrastructureScore * 0.35) + (itScore * 0.35) + (complianceScore * 0.30)
  )
  
  return {
    infrastructureScore: Math.round(infrastructureScore),
    itScore: Math.round(itScore),
    complianceScore: Math.round(complianceScore),
    overallScore
  }
}

function determineStatus(overallScore: number): "compliant" | "non-compliant" | "needs-improvement" {
  if (overallScore >= 80) return "compliant"
  if (overallScore >= 60) return "needs-improvement"
  return "non-compliant"
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const centerId = searchParams.get("centerId") || ""
    const status = searchParams.get("status") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""
    
    const db = await getDb()
    const auditsCollection = db.collection<AuditRecord>("audits")
    
    const query: Record<string, unknown> = {}
    
    if (centerId) {
      query.centerId = centerId
    }
    
    if (status) {
      query.status = status
    }
    
    if (startDate || endDate) {
      query.auditDate = {}
      if (startDate) {
        (query.auditDate as Record<string, Date>).$gte = new Date(startDate)
      }
      if (endDate) {
        (query.auditDate as Record<string, Date>).$lte = new Date(endDate)
      }
    }
    
    const total = await auditsCollection.countDocuments(query)
    const audits = await auditsCollection
      .find(query)
      .sort({ auditDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: {
        audits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get audits error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    
    const db = await getDb()
    const auditsCollection = db.collection<AuditRecord>("audits")
    
    const scores = calculateScores(body)
    const status = determineStatus(scores.overallScore)
    
    const audit: AuditRecord = {
      centerId: body.centerId,
      centerName: body.centerName,
      auditorId: user.userId,
      auditorName: user.name,
      auditDate: new Date(body.auditDate || new Date()),
      infrastructure: body.infrastructure,
      itInfrastructure: body.itInfrastructure,
      compliance: body.compliance,
      ...scores,
      status,
      remarks: body.remarks || "",
      recommendations: body.recommendations || [],
      photos: body.photos || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await auditsCollection.insertOne(audit)
    
    return NextResponse.json({
      success: true,
      data: { ...audit, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Create audit error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

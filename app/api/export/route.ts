import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { AuditRecord, ExamCenter } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"])
    
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "audits"
    const format = searchParams.get("format") || "json"
    
    const db = await getDb()
    
    let data: unknown[] = []
    let filename = ""
    
    if (type === "audits") {
      const auditsCollection = db.collection<AuditRecord>("audits")
      data = await auditsCollection.find().sort({ auditDate: -1 }).toArray()
      filename = `audits-export-${new Date().toISOString().split("T")[0]}`
    } else if (type === "centers") {
      const centersCollection = db.collection<ExamCenter>("centers")
      data = await centersCollection.find().sort({ createdAt: -1 }).toArray()
      filename = `centers-export-${new Date().toISOString().split("T")[0]}`
    }
    
    if (format === "csv") {
      const csvData = convertToCSV(data, type)
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Export error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

function convertToCSV(data: unknown[], type: string): string {
  if (data.length === 0) return ""
  
  let headers: string[] = []
  let rows: string[][] = []
  
  if (type === "audits") {
    headers = [
      "Center ID",
      "Center Name",
      "Auditor",
      "Audit Date",
      "Infrastructure Score",
      "IT Score",
      "Compliance Score",
      "Overall Score",
      "Status",
      "Remarks"
    ]
    
    rows = (data as AuditRecord[]).map((audit) => [
      audit.centerId,
      audit.centerName,
      audit.auditorName,
      new Date(audit.auditDate).toLocaleDateString(),
      audit.infrastructureScore.toString(),
      audit.itScore.toString(),
      audit.complianceScore.toString(),
      audit.overallScore.toString(),
      audit.status,
      audit.remarks.replace(/,/g, ";")
    ])
  } else if (type === "centers") {
    headers = [
      "Center ID",
      "Name",
      "Address",
      "City",
      "State",
      "Zone",
      "Capacity",
      "Contact Person",
      "Contact Phone",
      "Contact Email",
      "Status"
    ]
    
    rows = (data as ExamCenter[]).map((center) => [
      center.centerId,
      center.name,
      center.address.replace(/,/g, ";"),
      center.city,
      center.state,
      center.zone,
      center.capacity.toString(),
      center.contactPerson,
      center.contactPhone,
      center.contactEmail,
      center.status
    ])
  }
  
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
  ].join("\n")
  
  return csvContent
}

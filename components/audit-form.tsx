"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle2, Building2, Monitor, FileCheck, Lock } from "lucide-react"
import type { ExamCenter } from "@/lib/types"
import { NetworkScanner } from "@/components/network-scanner"

interface AuditFormProps {
  center: ExamCenter
  onComplete: () => void
  onCancel: () => void
}

interface InfrastructureData {
  buildingCondition: "excellent" | "good" | "fair" | "poor"
  powerBackup: boolean
  internetConnectivity: boolean
  cctv: boolean
  biometricSystem: boolean
  fireExtinguishers: boolean
  emergencyExits: boolean
  airConditioning: boolean
  lighting: boolean
  seatingArrangement: boolean
  drinkingWater: boolean
  toiletFacilities: boolean
}

interface ITInfrastructureData {
  totalComputers: number
  workingComputers: number
  serverRoom: boolean
  ups: boolean
  lan: boolean
  internetSpeed: string
  antivirus: boolean
  firewall: boolean
}

interface ComplianceData {
  licensesValid: boolean
  staffTrained: boolean
  examSoftwareInstalled: boolean
  mockTestConducted: boolean
  dataBackupSystem: boolean
  incidentReportingSystem: boolean
}

const STEPS = [
  { id: 1, title: "Infrastructure", icon: Building2 },
  { id: 2, title: "IT Infrastructure", icon: Monitor },
  { id: 3, title: "Compliance", icon: FileCheck },
  { id: 4, title: "Review", icon: CheckCircle2 },
]

export function AuditForm({ center, onComplete, onCancel }: AuditFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [infrastructure, setInfrastructure] = useState<InfrastructureData>({
    buildingCondition: "good",
    powerBackup: false,
    internetConnectivity: false,
    cctv: false,
    biometricSystem: false,
    fireExtinguishers: false,
    emergencyExits: false,
    airConditioning: false,
    lighting: false,
    seatingArrangement: false,
    drinkingWater: false,
    toiletFacilities: false,
  })

  const [itInfrastructure, setITInfrastructure] = useState<ITInfrastructureData>({
    totalComputers: 0,
    workingComputers: 0,
    serverRoom: false,
    ups: false,
    lan: false,
    internetSpeed: "",
    antivirus: false,
    firewall: false,
  })

  const [compliance, setCompliance] = useState<ComplianceData>({
    licensesValid: false,
    staffTrained: false,
    examSoftwareInstalled: false,
    mockTestConducted: false,
    dataBackupSystem: false,
    incidentReportingSystem: false,
  })

  const [remarks, setRemarks] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [networkScanComplete, setNetworkScanComplete] = useState(false)
  const [scannedIpList, setScannedIpList] = useState<string[]>([])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: center.centerId,
          centerName: center.name,
          auditDate: new Date().toISOString(),
          infrastructure,
          itInfrastructure,
          compliance,
          remarks,
          recommendations: recommendations
            .split("\n")
            .filter((r) => r.trim()),
          networkScan: networkScanComplete ? {
            systemCount: itInfrastructure.totalComputers,
            ipList: scannedIpList,
            scannedAt: new Date().toISOString(),
          } : null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        onComplete()
      } else {
        setError(data.error || "Failed to submit audit")
      }
    } catch {
      setError("Failed to submit audit")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Audit</h1>
          <p className="text-muted-foreground">
            {center.name} ({center.centerId})
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Step 1: Infrastructure */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Assessment</CardTitle>
            <CardDescription>
              Evaluate the physical infrastructure of the exam center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Building Condition</FieldLabel>
                <Select
                  value={infrastructure.buildingCondition}
                  onValueChange={(value) =>
                    setInfrastructure({
                      ...infrastructure,
                      buildingCondition: value as InfrastructureData["buildingCondition"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "powerBackup", label: "Power Backup (Generator/Inverter)" },
                  { key: "internetConnectivity", label: "Internet Connectivity" },
                  { key: "cctv", label: "CCTV Surveillance" },
                  { key: "biometricSystem", label: "Biometric System" },
                  { key: "fireExtinguishers", label: "Fire Extinguishers" },
                  { key: "emergencyExits", label: "Emergency Exits" },
                  { key: "airConditioning", label: "Air Conditioning" },
                  { key: "lighting", label: "Adequate Lighting" },
                  { key: "seatingArrangement", label: "Proper Seating Arrangement" },
                  { key: "drinkingWater", label: "Drinking Water Facility" },
                  { key: "toiletFacilities", label: "Clean Toilet Facilities" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      id={item.key}
                      checked={infrastructure[item.key as keyof InfrastructureData] as boolean}
                      onCheckedChange={(checked) =>
                        setInfrastructure({
                          ...infrastructure,
                          [item.key]: checked,
                        })
                      }
                    />
                    <label htmlFor={item.key} className="text-sm cursor-pointer">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 2: IT Infrastructure */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Network Scanner */}
          <NetworkScanner
            centerCode={center.centerId}
            centerName={center.name}
            onScanDataLoaded={(data) => {
              setITInfrastructure({
                ...itInfrastructure,
                totalComputers: data.systemCount,
                workingComputers: data.systemCount,
                lan: true,
              })
              setScannedIpList(data.ipList)
              setNetworkScanComplete(true)
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>IT Infrastructure Assessment</CardTitle>
              <CardDescription>
                Evaluate the IT systems and network infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="totalComputers" className="flex items-center gap-2">
                      Total Computers
                      {networkScanComplete && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                          <Lock className="h-3 w-3" />
                          Auto-detected
                        </span>
                      )}
                    </FieldLabel>
                    <Input
                      id="totalComputers"
                      type="number"
                      min="0"
                      value={itInfrastructure.totalComputers}
                      disabled={networkScanComplete}
                      className={networkScanComplete ? "bg-muted cursor-not-allowed" : ""}
                      onChange={(e) =>
                        setITInfrastructure({
                          ...itInfrastructure,
                          totalComputers: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    {networkScanComplete && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Detected via network scan. {scannedIpList.length} IPs found.
                      </p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="workingComputers">Working Computers</FieldLabel>
                    <Input
                      id="workingComputers"
                      type="number"
                      min="0"
                      max={itInfrastructure.totalComputers}
                      value={itInfrastructure.workingComputers}
                      onChange={(e) =>
                        setITInfrastructure({
                          ...itInfrastructure,
                          workingComputers: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="internetSpeed">Internet Speed</FieldLabel>
                  <Input
                    id="internetSpeed"
                    placeholder="e.g., 100 Mbps"
                    value={itInfrastructure.internetSpeed}
                    onChange={(e) =>
                      setITInfrastructure({
                        ...itInfrastructure,
                        internetSpeed: e.target.value,
                      })
                    }
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { key: "serverRoom", label: "Dedicated Server Room" },
                    { key: "ups", label: "UPS for All Systems" },
                    { key: "lan", label: "LAN Infrastructure" },
                    { key: "antivirus", label: "Antivirus Protection" },
                    { key: "firewall", label: "Firewall Protection" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        id={item.key}
                        checked={itInfrastructure[item.key as keyof ITInfrastructureData] as boolean}
                        onCheckedChange={(checked) =>
                          setITInfrastructure({
                            ...itInfrastructure,
                            [item.key]: checked,
                          })
                        }
                      />
                      <label htmlFor={item.key} className="text-sm cursor-pointer">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Compliance */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Assessment</CardTitle>
            <CardDescription>
              Verify regulatory and operational compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "licensesValid", label: "All Licenses Valid" },
                  { key: "staffTrained", label: "Staff Properly Trained" },
                  { key: "examSoftwareInstalled", label: "Exam Software Installed" },
                  { key: "mockTestConducted", label: "Mock Test Conducted" },
                  { key: "dataBackupSystem", label: "Data Backup System" },
                  { key: "incidentReportingSystem", label: "Incident Reporting System" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      id={item.key}
                      checked={compliance[item.key as keyof ComplianceData]}
                      onCheckedChange={(checked) =>
                        setCompliance({
                          ...compliance,
                          [item.key]: checked,
                        })
                      }
                    />
                    <label htmlFor={item.key} className="text-sm cursor-pointer">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>

              <Field>
                <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                <Textarea
                  id="remarks"
                  rows={4}
                  placeholder="Enter any additional observations..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="recommendations">Recommendations</FieldLabel>
                <Textarea
                  id="recommendations"
                  rows={4}
                  placeholder="Enter recommendations (one per line)..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Audit</CardTitle>
            <CardDescription>
              Review your assessment before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Infrastructure Summary */}
            <div>
              <h3 className="font-medium mb-2">Infrastructure</h3>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Building Condition:</span>{" "}
                  <span className="capitalize">{infrastructure.buildingCondition}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Facilities Available:</span>{" "}
                  {Object.entries(infrastructure)
                    .filter(([key, value]) => key !== "buildingCondition" && value)
                    .length}{" "}
                  of 11
                </p>
              </div>
            </div>

            {/* IT Summary */}
            <div>
              <h3 className="font-medium mb-2">IT Infrastructure</h3>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Computers:</span>{" "}
                  {itInfrastructure.workingComputers} working out of{" "}
                  {itInfrastructure.totalComputers}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Internet Speed:</span>{" "}
                  {itInfrastructure.internetSpeed || "Not specified"}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">IT Systems:</span>{" "}
                  {Object.entries(itInfrastructure)
                    .filter(
                      ([key, value]) =>
                        !["totalComputers", "workingComputers", "internetSpeed"].includes(key) &&
                        value
                    )
                    .length}{" "}
                  of 5
                </p>
              </div>
            </div>

            {/* Compliance Summary */}
            <div>
              <h3 className="font-medium mb-2">Compliance</h3>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Compliance Items:</span>{" "}
                  {Object.values(compliance).filter(Boolean).length} of 6
                </p>
              </div>
            </div>

            {/* Remarks */}
            {remarks && (
              <div>
                <h3 className="font-medium mb-2">Remarks</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{remarks}</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations && (
              <div>
                <h3 className="font-medium mb-2">Recommendations</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <ul className="list-disc pl-4 space-y-1">
                    {recommendations
                      .split("\n")
                      .filter((r) => r.trim())
                      .map((rec, i) => (
                        <li key={i} className="text-sm">
                          {rec}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={() => setCurrentStep((s) => s + 1)}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Audit
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

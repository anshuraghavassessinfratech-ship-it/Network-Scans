"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  QrCode,
  Camera,
  Search,
  Building2,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import type { ExamCenter, AuditRecord } from "@/lib/types"
import { AuditForm } from "@/components/audit-form"

export default function ScannerPage() {
  const [centerId, setCenterId] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [center, setCenter] = useState<ExamCenter | null>(null)
  const [latestAudit, setLatestAudit] = useState<AuditRecord | null>(null)
  const [error, setError] = useState("")
  const [showAuditForm, setShowAuditForm] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsScanning(true)

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(async () => {
          await scanFrame()
        }, 500)
      }
    } catch (err) {
      console.error("Failed to start camera:", err)
      setError("Failed to access camera. Please use manual entry.")
    }
  }

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
  }

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Simple QR detection using BarcodeDetector if available
    if ("BarcodeDetector" in window) {
      try {
        // @ts-expect-error BarcodeDetector is not in TypeScript types yet
        const barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] })
        const barcodes = await barcodeDetector.detect(imageData)

        if (barcodes.length > 0) {
          const qrValue = barcodes[0].rawValue
          stopScanning()
          setCenterId(qrValue)
          handleSearch(qrValue)
        }
      } catch {
        // BarcodeDetector failed silently
      }
    }
  }

  const handleSearch = async (id?: string) => {
    const searchId = id || centerId
    if (!searchId.trim()) {
      setError("Please enter a center ID")
      return
    }

    setIsSearching(true)
    setError("")
    setCenter(null)
    setLatestAudit(null)

    try {
      // Get device location
      let location = { latitude: 0, longitude: 0 }
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          })
        })
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
      } catch {
        // Location not available
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: searchId.trim(),
          location,
          deviceInfo: navigator.userAgent,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setCenter(data.data.center)
        setLatestAudit(data.data.latestAudit)
      } else {
        setError(data.error || "Center not found")
      }
    } catch {
      setError("Failed to search. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAuditComplete = () => {
    setShowAuditForm(false)
    setCenter(null)
    setLatestAudit(null)
    setCenterId("")
  }

  if (showAuditForm && center) {
    return (
      <AuditForm
        center={center}
        onComplete={handleAuditComplete}
        onCancel={() => setShowAuditForm(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Center Scanner</h1>
        <p className="text-muted-foreground">
          Scan QR code or enter center ID to start audit
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Exam Center</CardTitle>
          <CardDescription>
            Use the QR scanner or enter the center ID manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <Search className="h-4 w-4 mr-2" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="scan">
                <Camera className="h-4 w-4 mr-2" />
                QR Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearch()
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="centerId">Center ID</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="centerId"
                        value={centerId}
                        onChange={(e) => setCenterId(e.target.value)}
                        placeholder="Enter center ID (e.g., EXM-001)"
                      />
                      <Button type="submit" disabled={isSearching}>
                        {isSearching ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Field>
                </FieldGroup>
              </form>
            </TabsContent>

            <TabsContent value="scan" className="mt-4">
              <div className="space-y-4">
                {!isScanning ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                      Click the button below to start scanning
                    </p>
                    <Button onClick={startScanning}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={stopScanning}
                    >
                      Stop Scanning
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Center Details */}
      {center && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {center.name}
                </CardTitle>
                <CardDescription>{center.centerId}</CardDescription>
              </div>
              <Badge
                variant={
                  center.status === "active"
                    ? "default"
                    : center.status === "suspended"
                    ? "destructive"
                    : "secondary"
                }
              >
                {center.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {center.address}, {center.city}, {center.state}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Contact Person</p>
                  <p className="text-sm text-muted-foreground">
                    {center.contactPerson}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {center.contactPhone}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Capacity</p>
                <p className="text-sm text-muted-foreground">
                  {center.capacity} seats
                </p>
              </div>
            </div>

            {/* Latest Audit Info */}
            {latestAudit && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Last Audit</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(latestAudit.auditDate).toLocaleDateString()} by{" "}
                      {latestAudit.auditorName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {latestAudit.status === "compliant" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : latestAudit.status === "non-compliant" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="text-sm capitalize">
                        {latestAudit.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {latestAudit.overallScore}%
                    </p>
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowAuditForm(true)}
            >
              Start New Audit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

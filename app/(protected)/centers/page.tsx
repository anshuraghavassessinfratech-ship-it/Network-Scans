"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Plus, Search, Building2, MapPin, Phone, Mail, Edit, Trash2 } from "lucide-react"
import type { ExamCenter } from "@/lib/types"

const ZONES = ["North", "South", "East", "West", "Central"]
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh"
]

export default function CentersPage() {
  const { user } = useAuth()
  const [centers, setCenters] = useState<ExamCenter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [zoneFilter, setZoneFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCenter, setEditingCenter] = useState<ExamCenter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCenters = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(zoneFilter && { zone: zoneFilter }),
        ...(statusFilter && { status: statusFilter }),
      })

      const res = await fetch(`/api/centers?${params}`)
      const data = await res.json()

      if (data.success) {
        setCenters(data.data.centers)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch centers:", error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, search, zoneFilter, statusFilter])

  useEffect(() => {
    fetchCenters()
  }, [fetchCenters])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const centerData = {
      centerId: formData.get("centerId"),
      name: formData.get("name"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zone: formData.get("zone"),
      capacity: parseInt(formData.get("capacity") as string),
      contactPerson: formData.get("contactPerson"),
      contactPhone: formData.get("contactPhone"),
      contactEmail: formData.get("contactEmail"),
      status: formData.get("status"),
    }

    try {
      const url = editingCenter
        ? `/api/centers/${editingCenter._id}`
        : "/api/centers"
      const method = editingCenter ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(centerData),
      })

      const data = await res.json()

      if (data.success) {
        setIsDialogOpen(false)
        setEditingCenter(null)
        fetchCenters()
      } else {
        alert(data.error || "Failed to save center")
      }
    } catch {
      alert("Failed to save center")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (center: ExamCenter) => {
    if (!confirm(`Are you sure you want to delete ${center.name}?`)) return

    try {
      const res = await fetch(`/api/centers/${center._id}`, { method: "DELETE" })
      const data = await res.json()

      if (data.success) {
        fetchCenters()
      } else {
        alert(data.error || "Failed to delete center")
      }
    } catch {
      alert("Failed to delete center")
    }
  }

  const openEditDialog = (center: ExamCenter) => {
    setEditingCenter(center)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingCenter(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exam Centers</h1>
          <p className="text-muted-foreground">
            Manage registered examination centers
          </p>
        </div>

        {user?.role === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCenter(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Center
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCenter ? "Edit Center" : "Add New Center"}
                </DialogTitle>
                <DialogDescription>
                  {editingCenter
                    ? "Update the exam center details"
                    : "Register a new examination center"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="centerId">Center ID</FieldLabel>
                      <Input
                        id="centerId"
                        name="centerId"
                        defaultValue={editingCenter?.centerId}
                        required
                        disabled={!!editingCenter}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="name">Center Name</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingCenter?.name}
                        required
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editingCenter?.address}
                      required
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="city">City</FieldLabel>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={editingCenter?.city}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="state">State</FieldLabel>
                      <Select
                        name="state"
                        defaultValue={editingCenter?.state || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="zone">Zone</FieldLabel>
                      <Select
                        name="zone"
                        defaultValue={editingCenter?.zone || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {ZONES.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        defaultValue={editingCenter?.capacity}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="status">Status</FieldLabel>
                      <Select
                        name="status"
                        defaultValue={editingCenter?.status || "active"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="contactPerson">Contact Person</FieldLabel>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        defaultValue={editingCenter?.contactPerson}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contactPhone">Phone</FieldLabel>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        defaultValue={editingCenter?.contactPhone}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        defaultValue={editingCenter?.contactEmail}
                        required
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeDialog}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : editingCenter ? "Update" : "Create"}
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {ZONES.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Centers</CardTitle>
          <CardDescription>
            {pagination.total} center{pagination.total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : centers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No centers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Center</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role === "admin" && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centers.map((center) => (
                      <TableRow key={center._id?.toString()}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{center.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {center.centerId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {center.city}, {center.state}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{center.zone}</TableCell>
                        <TableCell>{center.capacity}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {center.contactPhone}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {center.contactEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        {user?.role === "admin" && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(center)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(center)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

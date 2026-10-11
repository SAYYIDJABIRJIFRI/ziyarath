import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Sparkles,
  Edit,
  ExternalLink,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Inbox,
  Lock,
  Layers,
  Phone,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyManagedPagesFn,
  updatePageContentFn,
  listAllotmentsFn,
} from "@/lib/content.functions";
import type { DbMaqam, DbUroos, PageAllotment } from "@/types/content";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "Admin — Manage Allotted Pages" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPagesManagement,
});

function AdminPagesManagement() {
  // Session / role state (with role switcher for testing & dev)
  const [currentRole, setCurrentRole] = useState<"super_admin" | "admin">("super_admin");
  const [currentUserEmail, setCurrentUserEmail] = useState("superadmin@ziyarath.com");
  const [currentUserId, setCurrentUserId] = useState("superadmin-001");

  const [maqams, setMaqams] = useState<DbMaqam[]>([]);
  const [uroosList, setUroosList] = useState<DbUroos[]>([]);
  const [allotments, setAllotments] = useState<PageAllotment[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "maqam" | "uroos">("all");

  // Edit Drawer State
  const [editItem, setEditItem] = useState<{
    type: "maqam" | "uroos";
    item: DbMaqam | DbUroos;
  } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const getPagesFn = useServerFn(getMyManagedPagesFn);
  const updatePageFn = useServerFn(updatePageContentFn);
  const listAllotFn = useServerFn(listAllotmentsFn);

  const loadData = async (role = currentRole, email = currentUserEmail, uid = currentUserId) => {
    setLoading(true);
    try {
      const [pagesRes, allotRes] = await Promise.all([
        getPagesFn({ data: { userId: uid, userEmail: email, role } }),
        listAllotFn(),
      ]);
      setMaqams(pagesRes.allottedMaqams as DbMaqam[]);
      setUroosList(pagesRes.allottedUroos as DbUroos[]);
      setIsSuperAdmin(Boolean(pagesRes.isSuperAdmin));
      setAllotments(allotRes as PageAllotment[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentRole, currentUserEmail, currentUserId);
  }, [currentRole, currentUserEmail, currentUserId]);

  const handleRoleSwitch = (newRole: "super_admin" | "admin") => {
    setCurrentRole(newRole);
    if (newRole === "super_admin") {
      setCurrentUserEmail("superadmin@ziyarath.com");
      setCurrentUserId("superadmin-001");
    } else {
      setCurrentUserEmail("admin@ziyarath.com");
      setCurrentUserId("admin-system");
    }
  };

  const openEditor = (type: "maqam" | "uroos", item: DbMaqam | DbUroos) => {
    setEditItem({ type, item });
    if (type === "maqam") {
      const m = item as DbMaqam;
      setEditForm({
        name: m.name,
        malayalamName: m.malayalamName || "",
        location: m.location,
        city: m.city,
        country: m.country,
        description: m.description,
        history: m.history || "",
        significance: m.significance || "",
        bestTimeToVisit: m.bestTimeToVisit || "",
        addressDetail: m.addressDetail || "",
        visitingHoursText: m.visitingHours
          ? m.visitingHours.map((v) => `${v.label}: ${v.hours}`).join("\n")
          : "",
        facilitiesText: m.facilities ? m.facilities.join(", ") : "",
      });
    } else {
      const u = item as DbUroos;
      setEditForm({
        title: u.title,
        malayalamTitle: u.malayalamTitle || "",
        restingPerson: u.restingPerson || "",
        city: u.city,
        state: u.state || "Kerala",
        country: u.country,
        description: u.description,
        history: u.history || "",
        significance: u.significance || "",
        gregorianDate: u.gregorianDate || "",
        recurrence: u.recurrence || "",
        nerchaOfferings: u.nerchaOfferings || "",
        venueName: u.venueName || "",
        programScheduleText: u.programSchedule
          ? u.programSchedule.map((p) => `${p.time} - ${p.event}`).join("\n")
          : "",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setSaving(true);
    try {
      const payloadData: Record<string, any> = { ...editForm };
      if (editItem.type === "maqam") {
        if (editForm.visitingHoursText) {
          payloadData.visitingHours = editForm.visitingHoursText
            .split("\n")
            .map((line: string) => {
              const [label, hours] = line.split(":");
              return { label: (label || "").trim(), hours: (hours || label).trim() };
            });
        }
        if (editForm.facilitiesText) {
          payloadData.facilities = editForm.facilitiesText
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
      } else {
        if (editForm.programScheduleText) {
          payloadData.programSchedule = editForm.programScheduleText
            .split("\n")
            .map((line: string) => {
              const [time, event] = line.split("-");
              return { time: (time || "").trim(), event: (event || time).trim() };
            });
        }
      }

      await updatePageFn({
        data: {
          type: editItem.type,
          id: editItem.item.id,
          editorId: currentUserId,
          editorEmail: currentUserEmail,
          data: payloadData,
        },
      });

      toast.success("Page updated successfully!");
      setEditItem(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update page");
    } finally {
      setSaving(false);
    }
  };

  // Find allotment info for an item
  const getAllotmentFor = (type: "maqam" | "uroos", id: string) => {
    return allotments.find((a) => a.targetType === type && a.targetId === id);
  };

  const filteredMaqams = useMemo(() => {
    if (typeFilter === "uroos") return [];
    if (!q.trim()) return maqams;
    const needle = q.toLowerCase();
    return maqams.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        (m.malayalamName && m.malayalamName.toLowerCase().includes(needle)) ||
        m.city.toLowerCase().includes(needle)
    );
  }, [maqams, typeFilter, q]);

  const filteredUroos = useMemo(() => {
    if (typeFilter === "maqam") return [];
    if (!q.trim()) return uroosList;
    const needle = q.toLowerCase();
    return uroosList.filter(
      (u) =>
        u.title.toLowerCase().includes(needle) ||
        (u.malayalamTitle && u.malayalamTitle.toLowerCase().includes(needle)) ||
        u.city.toLowerCase().includes(needle) ||
        (u.restingPerson && u.restingPerson.toLowerCase().includes(needle))
    );
  }, [uroosList, typeFilter, q]);

  const totalPagesCount = maqams.length + uroosList.length;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isSuperAdmin ? "All Portal Pages" : "My Allotted Pages"}
              </h1>
              <Badge className={isSuperAdmin ? "bg-primary/20 text-primary border-primary/30" : "bg-emerald-600/20 text-emerald-600 border-emerald-600/30"}>
                {isSuperAdmin ? "Super Admin View" : "Allotted Admin View"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? "Full editing privileges across all Maqams and Uroos pages."
                : `Showing pages allotted to ${currentUserEmail} for editing and maintenance.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role switch toggle */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
              <button
                onClick={() => handleRoleSwitch("super_admin")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentRole === "super_admin" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Super Admin
              </button>
              <button
                onClick={() => handleRoleSwitch("admin")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentRole === "admin" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Page Admin
              </button>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Admin Hub
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/requests">
                <Inbox className="mr-1.5 h-4 w-4" />
                Requests
              </Link>
            </Button>
            {isSuperAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/allotments">
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Allotments
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search managed pages…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "all" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({totalPagesCount})
              </button>
              <button
                onClick={() => setTypeFilter("maqam")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "maqam" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Maqams ({maqams.length})
              </button>
              <button
                onClick={() => setTypeFilter("uroos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "uroos" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Uroos ({uroosList.length})
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Loading pages…</p>
          </div>
        ) : totalPagesCount === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold">No Pages Allotted Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              You currently do not have any Maqam or Uroos pages allotted to your account.
              Contact the Super Admin to request an allotment.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Maqams Section */}
            {filteredMaqams.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-foreground">
                    Maqam Pages ({filteredMaqams.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMaqams.map((m) => {
                    const allot = getAllotmentFor("maqam", m.id);
                    return (
                      <Card key={m.id} className="overflow-hidden border-border bg-card flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {m.malayalamName && (
                                <p className="text-xs font-semibold text-emerald-600 font-sans">
                                  {m.malayalamName}
                                </p>
                              )}
                              <h3 className="text-base font-bold text-foreground leading-tight">
                                {m.name}
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5 shrink-0">
                              Maqam
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span>{m.location}, {m.city}</span>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {m.description}
                          </p>

                          {allot && (
                            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/50">
                              <UserCheck className="h-3 w-3 text-primary" />
                              Allotted to: <span className="font-semibold text-foreground">{allot.userEmail}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                          <Button asChild size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                            <Link to="/maqam/$id" params={{ id: m.id }} target="_blank">
                              <ExternalLink className="mr-1 h-3 w-3" /> Live
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => openEditor("maqam", m)} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <Edit className="h-3 w-3" /> Edit Page
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Uroos Section */}
            {filteredUroos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    Uroos Pages ({filteredUroos.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUroos.map((u) => {
                    const allot = getAllotmentFor("uroos", u.id);
                    return (
                      <Card key={u.id} className="overflow-hidden border-border bg-card flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {u.malayalamTitle && (
                                <p className="text-xs font-semibold text-primary font-sans">
                                  {u.malayalamTitle}
                                </p>
                              )}
                              <h3 className="text-base font-bold text-foreground leading-tight">
                                {u.title}
                              </h3>
                            </div>
                            {u.isStandalone ? (
                              <Badge className="bg-amber-600/90 text-white text-[10px] shrink-0">
                                Standalone
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600/90 text-white text-[10px] shrink-0">
                                Connected
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary" className="text-[10px]">
                              {u.hijriMonthName} • Day {u.hijriDay}
                            </Badge>
                            <span className="text-muted-foreground text-xs">{u.city}</span>
                          </div>

                          {u.restingPerson && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              Saint: <span className="font-medium text-foreground">{u.restingPerson}</span>
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {u.description}
                          </p>

                          {allot && (
                            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/50">
                              <UserCheck className="h-3 w-3 text-primary" />
                              Allotted to: <span className="font-semibold text-foreground">{allot.userEmail}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                          <Button asChild size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                            <Link to="/uroos/$id" params={{ id: u.id }} target="_blank">
                              <ExternalLink className="mr-1 h-3 w-3" /> Live
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => openEditor("uroos", u)} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <Edit className="h-3 w-3" /> Edit Page
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Page Drawer / Dialog */}
        <Dialog open={editItem !== null} onOpenChange={(o) => !o && setEditItem(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Edit {editItem?.type === "maqam" ? "Maqam" : "Uroos"} Details
              </DialogTitle>
              <DialogDescription>
                Updates saved here will immediately reflect on the public page ({editItem?.item.id}).
              </DialogDescription>
            </DialogHeader>

            {editItem && (
              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ed-title">
                      {editItem.type === "maqam" ? "Maqam Name" : "Uroos Title"}
                    </Label>
                    <Input
                      id="ed-title"
                      value={editItem.type === "maqam" ? editForm.name : editForm.title}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          [editItem.type === "maqam" ? "name" : "title"]: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-mal">Malayalam Title / Name</Label>
                    <Input
                      id="ed-mal"
                      value={
                        editItem.type === "maqam"
                          ? editForm.malayalamName
                          : editForm.malayalamTitle
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          [editItem.type === "maqam" ? "malayalamName" : "malayalamTitle"]:
                            e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {editItem.type === "uroos" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="ed-resting">Honored Saint / Scholar</Label>
                      <Input
                        id="ed-resting"
                        value={editForm.restingPerson || ""}
                        onChange={(e) => setEditForm({ ...editForm, restingPerson: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ed-greg">Gregorian Date / Season</Label>
                      <Input
                        id="ed-greg"
                        value={editForm.gregorianDate || ""}
                        onChange={(e) => setEditForm({ ...editForm, gregorianDate: e.target.value })}
                        placeholder="e.g. September (Annual)"
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ed-city">City / District</Label>
                    <Input
                      id="ed-city"
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-country">State / Country</Label>
                    <Input
                      id="ed-country"
                      value={editForm.country || "India"}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ed-desc">Description</Label>
                  <Textarea
                    id="ed-desc"
                    rows={4}
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ed-hist">History & Spiritual Background</Label>
                  <Textarea
                    id="ed-hist"
                    rows={3}
                    value={editForm.history || ""}
                    onChange={(e) => setEditForm({ ...editForm, history: e.target.value })}
                  />
                </div>

                {editItem.type === "maqam" ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="ed-hours">Visiting Hours (one per line, e.g. "Daily: Fajr to Isha")</Label>
                      <Textarea
                        id="ed-hours"
                        rows={2}
                        value={editForm.visitingHoursText || ""}
                        onChange={(e) => setEditForm({ ...editForm, visitingHoursText: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ed-fac">Facilities (comma-separated)</Label>
                      <Input
                        id="ed-fac"
                        value={editForm.facilitiesText || ""}
                        onChange={(e) => setEditForm({ ...editForm, facilitiesText: e.target.value })}
                        placeholder="Parking, Restroom, Ablution area"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="ed-prog">Program Schedule (one per line, e.g. "07:00 PM - Mawlid Majlis")</Label>
                      <Textarea
                        id="ed-prog"
                        rows={3}
                        value={editForm.programScheduleText || ""}
                        onChange={(e) => setEditForm({ ...editForm, programScheduleText: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ed-nercha">Nercha Offerings & Distribution</Label>
                      <Input
                        id="ed-nercha"
                        value={editForm.nerchaOfferings || ""}
                        onChange={(e) => setEditForm({ ...editForm, nerchaOfferings: e.target.value })}
                        placeholder="Cooked ghee rice (Neychoru), sweet offerings"
                      />
                    </div>
                  </>
                )}

                <DialogFooter className="gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setEditItem(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}

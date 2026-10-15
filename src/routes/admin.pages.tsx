import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Mail,
  Globe,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Eye,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyManagedPagesFn,
  updatePageContentFn,
  listAllotmentsFn,
} from "@/lib/content.functions";
import type { DbMaqam, DbUroos, PageAllotment } from "@/types/content";

// Bundled high-resolution assets for quick presets
import coverMampuram from "@/assets/maqam-mampuram.jpg";
import coverKondotty from "@/assets/maqam-kondotty.jpg";
import coverAjmer from "@/assets/maqam-ajmer.jpg";
import coverMalikDinar from "@/assets/place-malikdinar.jpg";
import coverNabawi from "@/assets/place-nabawi.jpg";
import coverHaram from "@/assets/place-haram.jpg";
import coverKerala from "@/assets/kerala-heritage.jpg";
import coverMosque from "@/assets/hero-mosque.jpg";

const IMAGE_PRESETS = [
  { label: "Mampuram Maqam", url: coverMampuram },
  { label: "Kondotty Maqam", url: coverKondotty },
  { label: "Ajmer Dargah", url: coverAjmer },
  { label: "Malik Dinar Juma", url: coverMalikDinar },
  { label: "Masjid Nabawi", url: coverNabawi },
  { label: "Masjid Al-Haram", url: coverHaram },
  { label: "Kerala Heritage", url: coverKerala },
  { label: "Grand Mosque", url: coverMosque },
];

const HIJRI_MONTHS = [
  { num: 1, name: "Muharram" },
  { num: 2, name: "Safar" },
  { num: 3, name: "Rabi al-Awwal" },
  { num: 4, name: "Rabi al-Thani" },
  { num: 5, name: "Jumada al-Awwal" },
  { num: 6, name: "Jumada al-Thani" },
  { num: 7, name: "Rajab" },
  { num: 8, name: "Sha'ban" },
  { num: 9, name: "Ramadan" },
  { num: 10, name: "Shawwal" },
  { num: 11, name: "Dhu al-Qi'dah" },
  { num: 12, name: "Dhu al-Hijjah" },
];

const MAQAM_CATEGORIES = [
  { value: "sufi", label: "Sufi Saint / Awliya" },
  { value: "scholar", label: "Islamic Scholar / Ulama" },
  { value: "sahaba", label: "Sahaba (Companion of the Prophet)" },
  { value: "shaheed", label: "Shaheed (Martyr)" },
  { value: "prophet", label: "Prophet / Anbiya" },
];

const CONTENT_REGIONS = [
  { value: "kerala", label: "Kerala, India" },
  { value: "india", label: "Rest of India" },
  { value: "middle-east", label: "Middle East / Arab World" },
  { value: "worldwide", label: "International / Worldwide" },
];

const STATUS_OPTIONS = [
  { value: "published", label: "Published (Live on Public Portal)" },
  { value: "draft", label: "Draft (Hidden from Public)" },
  { value: "archived", label: "Archived" },
];

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "Admin — Manage Allotted Pages & Content" },
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
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");

  // Edit Drawer State
  const [editItem, setEditItem] = useState<{
    type: "maqam" | "uroos";
    item: DbMaqam | DbUroos;
  } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleRoleSwitch = (persona: "super_admin" | "allotted_admin" | "unallotted_admin") => {
    if (persona === "super_admin") {
      setCurrentRole("super_admin");
      setCurrentUserEmail("superadmin@ziyarath.com");
      setCurrentUserId("superadmin-001");
    } else if (persona === "allotted_admin") {
      setCurrentRole("admin");
      setCurrentUserEmail("admin@ziyarath.com");
      setCurrentUserId("admin-system");
    } else {
      setCurrentRole("admin");
      setCurrentUserEmail("newadmin@ziyarath.com");
      setCurrentUserId("newadmin-001");
    }
  };

  const openEditor = (type: "maqam" | "uroos", item: DbMaqam | DbUroos) => {
    setEditItem({ type, item });
    setActiveTab("general");
    if (type === "maqam") {
      const m = item as DbMaqam;
      setEditForm({
        name: m.name || "",
        malayalamName: m.malayalamName || "",
        category: m.category || "sufi",
        region: m.region || "kerala",
        era: m.era || "",
        status: m.status || "published",
        location: m.location || "",
        city: m.city || "",
        country: m.country || "India",
        addressDetail: m.addressDetail || "",
        coverImage: m.coverImage || "",
        sourceUrl: m.sourceUrl || "",
        description: m.description || "",
        significance: m.significance || "",
        history: m.history || "",
        architecture: m.architecture || "",
        bestTimeToVisit: m.bestTimeToVisit || "",
        phone: m.contactInfo?.phone || "",
        email: m.contactInfo?.email || "",
        website: m.contactInfo?.website || "",
        visitingHoursText: m.visitingHours
          ? m.visitingHours.map((v) => `${v.label}: ${v.hours}`).join("\n")
          : "",
        facilitiesText: m.facilities ? m.facilities.join(", ") : "",
        howToReachText: m.howToReach
          ? m.howToReach.map((h) => `${h.mode}: ${h.details}`).join("\n")
          : "",
      });
    } else {
      const u = item as DbUroos;
      setEditForm({
        title: u.title || "",
        malayalamTitle: u.malayalamTitle || "",
        restingPerson: u.restingPerson || "",
        status: u.status || "published",
        isStandalone: Boolean(u.isStandalone),
        maqamId: u.maqamId || "",
        hijriMonth: u.hijriMonth || 1,
        hijriMonthName: u.hijriMonthName || "Muharram",
        hijriDay: u.hijriDay || 1,
        gregorianDate: u.gregorianDate || "",
        recurrence: u.recurrence || "Annual",
        venueName: u.venueName || "",
        city: u.city || "",
        state: u.state || "Kerala",
        country: u.country || "India",
        region: u.region || "kerala",
        organizerName: u.organizerName || "",
        organizerContact: u.organizerContact || "",
        coverImage: u.coverImage || "",
        sourceUrl: u.sourceUrl || "",
        description: u.description || "",
        significance: u.significance || "",
        history: u.history || "",
        nerchaOfferings: u.nerchaOfferings || "",
        programScheduleText: u.programSchedule
          ? u.programSchedule.map((p) => `${p.time} - ${p.event}${p.description ? ` (${p.description})` : ""}`).join("\n")
          : "",
        howToReachText: u.howToReach
          ? u.howToReach.map((h) => `${h.mode}: ${h.details}`).join("\n")
          : "",
      });
    }
  };

  // Client-side image upload & compression via HTML5 canvas
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setEditForm((prev) => ({ ...prev, coverImage: compressedDataUrl }));
          toast.success("Image uploaded & optimized successfully!");
        }
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
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
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string) => {
              const parts = line.split(":");
              const label = parts[0]?.trim() || "Hours";
              const hours = parts.slice(1).join(":").trim() || label;
              return { label, hours };
            });
        } else {
          payloadData.visitingHours = [];
        }

        if (editForm.facilitiesText) {
          payloadData.facilities = editForm.facilitiesText
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        } else {
          payloadData.facilities = [];
        }

        if (editForm.howToReachText) {
          payloadData.howToReach = editForm.howToReachText
            .split("\n")
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string) => {
              const parts = line.split(":");
              const mode = parts[0]?.trim() || "Road";
              const details = parts.slice(1).join(":").trim() || mode;
              return { mode, details };
            });
        }

        payloadData.contactInfo = {
          phone: editForm.phone?.trim() || undefined,
          email: editForm.email?.trim() || undefined,
          website: editForm.website?.trim() || undefined,
        };
      } else {
        // Uroos
        payloadData.isStandalone = Boolean(editForm.isStandalone);
        payloadData.maqamId = editForm.isStandalone ? null : (editForm.maqamId?.trim() || null);
        payloadData.hijriMonth = Number(editForm.hijriMonth || 1);
        payloadData.hijriDay = Number(editForm.hijriDay || 1);

        if (editForm.programScheduleText) {
          payloadData.programSchedule = editForm.programScheduleText
            .split("\n")
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string) => {
              const parts = line.split("-");
              const time = parts[0]?.trim() || "All Day";
              const event = parts.slice(1).join("-").trim() || time;
              return { time, event };
            });
        } else {
          payloadData.programSchedule = [];
        }

        if (editForm.howToReachText) {
          payloadData.howToReach = editForm.howToReachText
            .split("\n")
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string) => {
              const parts = line.split(":");
              const mode = parts[0]?.trim() || "Road";
              const details = parts.slice(1).join(":").trim() || mode;
              return { mode, details };
            });
        }
      }

      await updatePageFn({
        data: {
          type: editItem.type,
          id: editItem.item.id,
          editorId: currentUserId,
          editorEmail: currentUserEmail,
          editorRole: currentRole,
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
    let list = maqams;
    if (statusFilter !== "all") {
      list = list.filter((m) => (m.status || "published") === statusFilter);
    }
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        (m.malayalamName && m.malayalamName.toLowerCase().includes(needle)) ||
        m.city.toLowerCase().includes(needle) ||
        m.id.toLowerCase().includes(needle)
    );
  }, [maqams, typeFilter, statusFilter, q]);

  const filteredUroos = useMemo(() => {
    if (typeFilter === "maqam") return [];
    let list = uroosList;
    if (statusFilter !== "all") {
      list = list.filter((u) => (u.status || "published") === statusFilter);
    }
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (u) =>
        u.title.toLowerCase().includes(needle) ||
        (u.malayalamTitle && u.malayalamTitle.toLowerCase().includes(needle)) ||
        u.city.toLowerCase().includes(needle) ||
        (u.restingPerson && u.restingPerson.toLowerCase().includes(needle)) ||
        u.id.toLowerCase().includes(needle)
    );
  }, [uroosList, typeFilter, statusFilter, q]);

  const totalPagesCount = maqams.length + uroosList.length;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isSuperAdmin ? "All Portal Pages" : "My Allotted Pages"}
              </h1>
              <Badge
                className={
                  isSuperAdmin
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-emerald-600/20 text-emerald-600 border-emerald-600/30"
                }
              >
                {isSuperAdmin ? "Super Admin (All Pages)" : "Page Admin (Allotted Only)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? "Full editing privileges across all Maqams and Uroos pages in the portal."
                : `Showing only pages allotted to ${currentUserEmail} for editing and maintenance.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role switch toggle */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
              <button
                onClick={() => handleRoleSwitch("super_admin")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentUserEmail === "superadmin@ziyarath.com"
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Super Admin
              </button>
              <button
                onClick={() => handleRoleSwitch("allotted_admin")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentUserEmail === "admin@ziyarath.com"
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Allotted Admin
              </button>
              <button
                onClick={() => handleRoleSwitch("unallotted_admin")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentUserEmail === "newadmin@ziyarath.com"
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                New Admin (Unallotted)
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

        {/* Access level informative banner */}
        {!isSuperAdmin ? (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Page Admin Mode:</strong> You can view and edit <strong>only pages allotted to your account</strong> ({currentUserEmail}). Non-allotted pages are restricted.
                {totalPagesCount === 0 && " (You currently have only an active login account with 0 pages allotted)."}
              </span>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shrink-0 w-fit">
              {totalPagesCount} Allotted {totalPagesCount === 1 ? "Page" : "Pages"}
            </Badge>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-primary-950 dark:text-primary-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>Super Admin Mode:</strong> Unrestricted access across all {totalPagesCount} portal pages, full allotments delegation, and request approvals.
              </span>
            </div>
            <Badge className="bg-primary text-primary-foreground shrink-0 w-fit">
              Super Admin Authority
            </Badge>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search managed pages by title, Malayalam, city, ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "all"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({totalPagesCount})
              </button>
              <button
                onClick={() => setTypeFilter("maqam")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "maqam"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Maqams ({maqams.length})
              </button>
              <button
                onClick={() => setTypeFilter("uroos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "uroos"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Uroos ({uroosList.length})
              </button>
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as any)}
            >
              <SelectTrigger className="h-10 text-xs w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

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
          <Card className="p-10 text-center border-dashed bg-card/60 max-w-2xl mx-auto my-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Lock className="h-7 w-7" />
            </div>
            <Badge className="mb-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
              Page Admin Login Account • 0 Pages Allotted
            </Badge>
            <h3 className="text-xl font-bold text-foreground">
              {currentUserEmail}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              Your <strong>Page Admin</strong> account is active, but you currently have <strong>only a login account</strong>. No Maqam or Uroos pages have been allotted to you yet.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-xs text-left text-muted-foreground space-y-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Account Active:</strong> You can sign in and access the portal dashboard.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Access Policy:</strong> New admins are Page Admins by default. If no page has been allotted to you, you cannot edit any pages.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>How to Get Allotted:</strong> The Super Admin assigns pages to your email in <span className="font-semibold text-foreground">/admin/allotments</span> or when approving a community submission.
                </span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRoleSwitch("super_admin")}
                className="text-xs gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Switch to Super Admin to Allot a Page
              </Button>
            </div>
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
                    const status = m.status || "published";
                    return (
                      <Card
                        key={m.id}
                        className="overflow-hidden border-border bg-card flex flex-col justify-between hover:shadow-md transition-all group"
                      >
                        {/* Cover image banner */}
                        <div className="relative h-32 w-full bg-muted/60 overflow-hidden border-b border-border/40">
                          {m.coverImage ? (
                            <img
                              src={m.coverImage}
                              alt={m.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 to-primary/10">
                              <Building2 className="h-10 w-10 text-emerald-600/40" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 flex gap-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-background/90 backdrop-blur-sm border-emerald-500/40 text-emerald-600 font-semibold"
                            >
                              Maqam
                            </Badge>
                            <Badge
                              className={`text-[10px] uppercase tracking-wider font-semibold ${
                                status === "published"
                                  ? "bg-emerald-600 text-white"
                                  : status === "draft"
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-600 text-white"
                              }`}
                            >
                              {status}
                            </Badge>
                          </div>
                          {m.category && (
                            <div className="absolute top-2 right-2">
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-background/90 backdrop-blur-sm capitalize"
                              >
                                {m.category}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
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

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span>
                              {m.location ? `${m.location}, ` : ""}
                              {m.city}, {m.country}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {m.description}
                          </p>

                          {allot && (
                            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/50">
                              <UserCheck className="h-3 w-3 text-primary" />
                              Allotted to:{" "}
                              <span className="font-semibold text-foreground">
                                {allot.userEmail}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Link to="/maqam/$id" params={{ id: m.id }} target="_blank">
                              <ExternalLink className="mr-1 h-3 w-3" /> Live
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openEditor("maqam", m)}
                            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          >
                            <Edit className="h-3 w-3" /> Edit Page &amp; Image
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
                    const status = u.status || "published";
                    return (
                      <Card
                        key={u.id}
                        className="overflow-hidden border-border bg-card flex flex-col justify-between hover:shadow-md transition-all group"
                      >
                        {/* Cover image banner */}
                        <div className="relative h-32 w-full bg-muted/60 overflow-hidden border-b border-border/40">
                          {u.coverImage ? (
                            <img
                              src={u.coverImage}
                              alt={u.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/10 to-primary/10">
                              <Sparkles className="h-10 w-10 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 flex gap-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-background/90 backdrop-blur-sm border-primary/40 text-primary font-semibold"
                            >
                              Uroos
                            </Badge>
                            <Badge
                              className={`text-[10px] uppercase tracking-wider font-semibold ${
                                status === "published"
                                  ? "bg-emerald-600 text-white"
                                  : status === "draft"
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-600 text-white"
                              }`}
                            >
                              {status}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            {u.isStandalone ? (
                              <Badge className="bg-amber-600/90 text-white text-[10px]">
                                Standalone
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600/90 text-white text-[10px]">
                                Connected
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
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

                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary" className="text-[10px]">
                              {u.hijriMonthName} • Day {u.hijriDay}
                            </Badge>
                            <span className="text-muted-foreground text-xs">{u.city}</span>
                          </div>

                          {u.restingPerson && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              Saint:{" "}
                              <span className="font-medium text-foreground">
                                {u.restingPerson}
                              </span>
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {u.description}
                          </p>

                          {allot && (
                            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/50">
                              <UserCheck className="h-3 w-3 text-primary" />
                              Allotted to:{" "}
                              <span className="font-semibold text-foreground">
                                {allot.userEmail}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Link to="/uroos/$id" params={{ id: u.id }} target="_blank">
                              <ExternalLink className="mr-1 h-3 w-3" /> Live
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openEditor("uroos", u)}
                            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          >
                            <Edit className="h-3 w-3" /> Edit Page &amp; Image
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

        {/* Comprehensive Edit Dialog */}
        <Dialog open={editItem !== null} onOpenChange={(o) => !o && setEditItem(null)}>
          <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl p-0">
            <DialogHeader className="p-6 pb-2 border-b border-border sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Edit className="h-5 w-5 text-primary" />
                    Edit {editItem?.type === "maqam" ? "Maqam / Shrine" : "Uroos Festival"}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Manage details, multimedia cover image, location, contacts, and schedules for{" "}
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-semibold">
                      {editItem?.item.id}
                    </code>
                  </DialogDescription>
                </div>
                <Badge
                  className={`capitalize px-2.5 py-1 ${
                    editForm.status === "published"
                      ? "bg-emerald-600 text-white"
                      : editForm.status === "draft"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-600 text-white"
                  }`}
                >
                  {editForm.status || "published"}
                </Badge>
              </div>

              {/* Tabs Bar */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full mt-4"
              >
                <TabsList className="grid w-full grid-cols-5 text-xs h-9">
                  <TabsTrigger value="general" className="text-xs">
                    General
                  </TabsTrigger>
                  <TabsTrigger value="media" className="text-xs">
                    Image &amp; Media
                  </TabsTrigger>
                  <TabsTrigger value="location" className="text-xs">
                    Location &amp; Contact
                  </TabsTrigger>
                  <TabsTrigger value="details" className="text-xs">
                    Details &amp; History
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="text-xs">
                    {editItem?.type === "maqam" ? "Visiting &amp; Hours" : "Schedule &amp; Nercha"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </DialogHeader>

            {editItem && (
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* ---------------- Tab 1: General ---------------- */}
                {activeTab === "general" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ed-title" className="font-semibold">
                          {editItem.type === "maqam" ? "Maqam / Shrine Name *" : "Uroos Title *"}
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
                          placeholder={editItem.type === "maqam" ? "e.g. Mampuram Maqam" : "e.g. Mampuram Uroos Mubarak"}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ed-mal" className="font-semibold">
                          Malayalam Name / Title
                        </Label>
                        <Input
                          id="ed-mal"
                          value={
                            editItem.type === "maqam"
                              ? editForm.malayalamName || ""
                              : editForm.malayalamTitle || ""
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              [editItem.type === "maqam" ? "malayalamName" : "malayalamTitle"]:
                                e.target.value,
                            })
                          }
                          placeholder="e.g. മമ്പുറം മഖാം / നേർച്ച"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Publication Status */}
                      <div className="space-y-2">
                        <Label className="font-semibold">Publication Status</Label>
                        <Select
                          value={editForm.status || "published"}
                          onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Maqam: Category */}
                      {editItem.type === "maqam" && (
                        <>
                          <div className="space-y-2">
                            <Label className="font-semibold">Category</Label>
                            <Select
                              value={editForm.category || "sufi"}
                              onValueChange={(val) => setEditForm({ ...editForm, category: val })}
                            >
                              <SelectTrigger className="h-10 text-xs">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {MAQAM_CATEGORIES.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ed-era" className="font-semibold">
                              Era / Historical Period
                            </Label>
                            <Input
                              id="ed-era"
                              value={editForm.era || ""}
                              onChange={(e) => setEditForm({ ...editForm, era: e.target.value })}
                              placeholder="e.g. 18th Century CE / 12th Century AH"
                            />
                          </div>
                        </>
                      )}

                      {/* Uroos: Saint & Recurrence */}
                      {editItem.type === "uroos" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="ed-resting" className="font-semibold">
                              Honored Saint / Scholar
                            </Label>
                            <Input
                              id="ed-resting"
                              value={editForm.restingPerson || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, restingPerson: e.target.value })
                              }
                              placeholder="e.g. Sayyid Alawi Thangal"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ed-recurrence" className="font-semibold">
                              Recurrence
                            </Label>
                            <Input
                              id="ed-recurrence"
                              value={editForm.recurrence || "Annual"}
                              onChange={(e) =>
                                setEditForm({ ...editForm, recurrence: e.target.value })
                              }
                              placeholder="e.g. Annual (10 days in Muharram)"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Uroos Hijri Date & Standalone connection */}
                    {editItem.type === "uroos" && (
                      <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label className="font-semibold">Islamic (Hijri) Month</Label>
                            <Select
                              value={String(editForm.hijriMonth || 1)}
                              onValueChange={(val) => {
                                const mNum = Number(val);
                                const found = HIJRI_MONTHS.find((m) => m.num === mNum);
                                setEditForm({
                                  ...editForm,
                                  hijriMonth: mNum,
                                  hijriMonthName: found ? found.name : editForm.hijriMonthName,
                                });
                              }}
                            >
                              <SelectTrigger className="h-10 text-xs">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent>
                                {HIJRI_MONTHS.map((m) => (
                                  <SelectItem key={m.num} value={String(m.num)}>
                                    {m.num}. {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ed-hday" className="font-semibold">
                              Hijri Day (1-30)
                            </Label>
                            <Input
                              id="ed-hday"
                              type="number"
                              min={1}
                              max={30}
                              value={editForm.hijriDay || 1}
                              onChange={(e) =>
                                setEditForm({ ...editForm, hijriDay: Number(e.target.value) })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ed-greg" className="font-semibold">
                              Gregorian Date / Season
                            </Label>
                            <Input
                              id="ed-greg"
                              value={editForm.gregorianDate || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, gregorianDate: e.target.value })
                              }
                              placeholder="e.g. October 2026 / Annual"
                            />
                          </div>
                        </div>

                        {/* Standalone vs Connected Maqam */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/50 pt-3">
                          <div className="space-y-0.5">
                            <Label className="font-semibold">Page Connection Mode</Label>
                            <p className="text-xs text-muted-foreground">
                              Standalone Uroos has its own festival landing page. Connected Uroos links to a parent Maqam.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {editForm.isStandalone ? "Standalone Page" : "Connected to Maqam"}
                            </span>
                            <Switch
                              checked={editForm.isStandalone}
                              onCheckedChange={(checked) =>
                                setEditForm({ ...editForm, isStandalone: checked })
                              }
                            />
                          </div>
                        </div>

                        {!editForm.isStandalone && (
                          <div className="space-y-2 pt-1">
                            <Label className="font-semibold text-xs">Connected Maqam Shrine</Label>
                            <Select
                              value={editForm.maqamId || ""}
                              onValueChange={(val) => setEditForm({ ...editForm, maqamId: val })}
                            >
                              <SelectTrigger className="h-10 text-xs">
                                <SelectValue placeholder="Select parent Maqam" />
                              </SelectTrigger>
                              <SelectContent>
                                {maqams.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.city})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- Tab 2: Image & Media ---------------- */}
                {activeTab === "media" && (
                  <div className="space-y-6">
                    {/* Live Preview & Actions */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">
                            Cover Image &amp; Visual Preview
                          </h4>
                        </div>
                        {editForm.coverImage && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setEditForm({ ...editForm, coverImage: "" })}
                          >
                            <Trash2 className="h-3 w-3" /> Remove Cover Image
                          </Button>
                        )}
                      </div>

                      {editForm.coverImage ? (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted/40 shadow-sm max-h-[300px]">
                          <img
                            src={editForm.coverImage}
                            alt="Cover Preview"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-background/90 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-foreground shadow">
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            Active Cover Image Set
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-center bg-muted/10">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <p className="text-sm font-medium text-foreground">No cover image set yet</p>
                          <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            Upload a picture from your device, choose from the preset gallery below, or paste an image URL.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Image Upload & Direct Input */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Device File Upload */}
                      <div className="rounded-lg border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                        <div>
                          <Label className="font-semibold flex items-center gap-1.5">
                            <Upload className="h-4 w-4 text-primary" /> Upload from Computer / Mobile
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pick any photo (PNG, JPEG, WebP). It is automatically compressed to high-res lightweight format.
                          </p>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileUpload}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full gap-2 border-primary/30 hover:bg-primary/10"
                        >
                          <Upload className="h-4 w-4 text-primary" /> Select &amp; Upload Photo
                        </Button>
                      </div>

                      {/* Direct URL input */}
                      <div className="rounded-lg border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                        <div>
                          <Label htmlFor="ed-img-url" className="font-semibold flex items-center gap-1.5">
                            <LinkIcon className="h-4 w-4 text-primary" /> Or Paste Image URL
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Link directly to an online image URL, CDN link, or `/assets/...` path.
                          </p>
                        </div>

                        <Input
                          id="ed-img-url"
                          value={editForm.coverImage || ""}
                          onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="h-10 text-xs"
                        />
                      </div>
                    </div>

                    {/* Quick Preset Library */}
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <Label className="font-semibold flex items-center gap-1.5 text-xs">
                        <Sparkles className="h-4 w-4 text-primary" /> Quick Preset Gallery (Click to Apply)
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setEditForm({ ...editForm, coverImage: preset.url });
                              toast.success(`Applied ${preset.label} preset`);
                            }}
                            className={`group relative aspect-[4/3] rounded-md overflow-hidden border text-left transition-all ${
                              editForm.coverImage === preset.url
                                ? "ring-2 ring-primary border-primary shadow-md"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex items-end">
                              <span className="text-[11px] font-medium text-white line-clamp-1">
                                {preset.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reference / Source URL */}
                    <div className="space-y-2">
                      <Label htmlFor="ed-source" className="font-semibold flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-primary" /> Reference / Official Source URL
                      </Label>
                      <Input
                        id="ed-source"
                        value={editForm.sourceUrl || ""}
                        onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                        placeholder="https://official-shrine-website.org or Waqf Board link"
                      />
                    </div>
                  </div>
                )}

                {/* ---------------- Tab 3: Location & Contact ---------------- */}
                {activeTab === "location" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="ed-loc" className="font-semibold">
                          {editItem.type === "maqam" ? "Locality / Town" : "Venue / Ground Name"}
                        </Label>
                        <Input
                          id="ed-loc"
                          value={
                            editItem.type === "maqam"
                              ? editForm.location || ""
                              : editForm.venueName || ""
                          }
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              [editItem.type === "maqam" ? "location" : "venueName"]: e.target.value,
                            })
                          }
                          placeholder={editItem.type === "maqam" ? "e.g. Mampuram, Tirurangadi" : "e.g. Juma Masjid Grounds"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ed-city" className="font-semibold">
                          City / District *
                        </Label>
                        <Input
                          id="ed-city"
                          value={editForm.city || ""}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          placeholder="e.g. Malappuram"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ed-country" className="font-semibold">
                          Country
                        </Label>
                        <Input
                          id="ed-country"
                          value={editForm.country || "India"}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          placeholder="e.g. India"
                        />
                      </div>
                    </div>

                    {/* Region */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-semibold">Region</Label>
                        <Select
                          value={editForm.region || "kerala"}
                          onValueChange={(val) => setEditForm({ ...editForm, region: val })}
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_REGIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ed-state" className="font-semibold">
                          State / Province
                        </Label>
                        <Input
                          id="ed-state"
                          value={editForm.state || "Kerala"}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          placeholder="e.g. Kerala"
                        />
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="space-y-2">
                      <Label htmlFor="ed-address" className="font-semibold">
                        Full Address / Landmark Details
                      </Label>
                      <Textarea
                        id="ed-address"
                        rows={2}
                        value={editForm.addressDetail || ""}
                        onChange={(e) => setEditForm({ ...editForm, addressDetail: e.target.value })}
                        placeholder="Street, landmark, PIN code, postal address…"
                      />
                    </div>

                    {/* Contact Details */}
                    {editItem.type === "maqam" ? (
                      <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Caretaker &amp; Office Contacts
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="ed-phone" className="text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3 text-primary" /> Phone
                            </Label>
                            <Input
                              id="ed-phone"
                              value={editForm.phone || ""}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="+91 494 246 0000"
                              className="h-9 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="ed-email" className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3 text-primary" /> Email
                            </Label>
                            <Input
                              id="ed-email"
                              value={editForm.email || ""}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder="info@shrine.org"
                              className="h-9 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="ed-web" className="text-xs flex items-center gap-1">
                              <Globe className="h-3 w-3 text-primary" /> Website
                            </Label>
                            <Input
                              id="ed-web"
                              value={editForm.website || ""}
                              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                              placeholder="https://shrine.org"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Organizing Committee &amp; Help Desk
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="ed-org-name" className="text-xs">
                              Committee / Trust Name
                            </Label>
                            <Input
                              id="ed-org-name"
                              value={editForm.organizerName || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, organizerName: e.target.value })
                              }
                              placeholder="e.g. Uroos Organizing Committee"
                              className="h-9 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="ed-org-contact" className="text-xs">
                              Organizer Phone / Email
                            </Label>
                            <Input
                              id="ed-org-contact"
                              value={editForm.organizerContact || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, organizerContact: e.target.value })
                              }
                              placeholder="+91 98470 12345 / committee@uroos.org"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- Tab 4: Details & History ---------------- */}
                {activeTab === "details" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ed-desc" className="font-semibold">
                        Summary Description *
                      </Label>
                      <Textarea
                        id="ed-desc"
                        rows={4}
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Comprehensive summary of the site / event, its spiritual prestige, and pilgrimage community…"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ed-signif" className="font-semibold">
                        Spiritual Significance &amp; Traditions
                      </Label>
                      <Textarea
                        id="ed-signif"
                        rows={3}
                        value={editForm.significance || ""}
                        onChange={(e) => setEditForm({ ...editForm, significance: e.target.value })}
                        placeholder="Spiritual importance, blessings (barakah), annual traditions, miracles or scholarly teachings…"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ed-hist" className="font-semibold">
                        History &amp; Lineage
                      </Label>
                      <Textarea
                        id="ed-hist"
                        rows={4}
                        value={editForm.history || ""}
                        onChange={(e) => setEditForm({ ...editForm, history: e.target.value })}
                        placeholder="Detailed historical account, arrival in the region, scholarly achievements, and historical milestones…"
                      />
                    </div>

                    {editItem.type === "maqam" && (
                      <div className="space-y-2">
                        <Label htmlFor="ed-arch" className="font-semibold">
                          Architecture &amp; Structure
                        </Label>
                        <Textarea
                          id="ed-arch"
                          rows={2}
                          value={editForm.architecture || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, architecture: e.target.value })
                          }
                          placeholder="e.g. Traditional timber architecture, Malabar style dome, brass lamps, and wooden carvings…"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- Tab 5: Schedule & Logistics ---------------- */}
                {activeTab === "schedule" && (
                  <div className="space-y-4">
                    {editItem.type === "maqam" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="ed-besttime" className="font-semibold">
                            Best Time to Visit
                          </Label>
                          <Input
                            id="ed-besttime"
                            value={editForm.bestTimeToVisit || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, bestTimeToVisit: e.target.value })
                            }
                            placeholder="e.g. Year round, early mornings after Fajr, or annual Uroos in Muharram"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ed-hours" className="font-semibold">
                            Visiting Hours (one entry per line)
                          </Label>
                          <Textarea
                            id="ed-hours"
                            rows={3}
                            value={editForm.visitingHoursText || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, visitingHoursText: e.target.value })
                            }
                            placeholder={`Daily: 05:00 AM - 10:00 PM\nJumu'ah: Fajr to 11:30 PM\nLadies: 08:00 AM - 06:00 PM`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Format: <code>Label: Opening hours</code> (e.g. <code>Daily: 05:00 AM - 10:00 PM</code>)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ed-fac" className="font-semibold">
                            Facilities &amp; Amenities (comma-separated)
                          </Label>
                          <Input
                            id="ed-fac"
                            value={editForm.facilitiesText || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, facilitiesText: e.target.value })
                            }
                            placeholder="Parking, Ablution area (Wudu), Restrooms, Women's Prayer Space, Wheelchair Accessible"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ed-reach-m" className="font-semibold">
                            How to Reach (one entry per line)
                          </Label>
                          <Textarea
                            id="ed-reach-m"
                            rows={3}
                            value={editForm.howToReachText || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, howToReachText: e.target.value })
                            }
                            placeholder={`Flight: Calicut International Airport (CCJ) - 18 km\nTrain: Parappanangadi Railway Station - 8 km\nRoad: Well connected via NH 66; buses from Tirurangadi`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Format: <code>Mode: Details</code> (e.g. <code>Train: Station name - distance</code>)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="ed-prog" className="font-semibold">
                            Program Schedule (one event per line)
                          </Label>
                          <Textarea
                            id="ed-prog"
                            rows={4}
                            value={editForm.programScheduleText || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, programScheduleText: e.target.value })
                            }
                            placeholder={`07:00 AM - Kodi Ettam (Flag Hoisting)\n10:00 AM - Quran Khatm & Du'a Majlis\n07:00 PM - Grand Mawlid & Spiritual Discourse\n10:30 PM - Annadhanam / Nercha Distribution`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Format: <code>Time - Event Description</code> (e.g. <code>07:00 PM - Grand Mawlid Majlis</code>)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ed-nercha" className="font-semibold">
                            Nercha Offerings &amp; Distribution Details
                          </Label>
                          <Textarea
                            id="ed-nercha"
                            rows={2}
                            value={editForm.nerchaOfferings || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, nerchaOfferings: e.target.value })
                            }
                            placeholder="e.g. Cooked ghee rice (Neychoru) tabarruk distributed to thousands of pilgrims and local community."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ed-reach-u" className="font-semibold">
                            Travel &amp; Directions for Pilgrims
                          </Label>
                          <Textarea
                            id="ed-reach-u"
                            rows={3}
                            value={editForm.howToReachText || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, howToReachText: e.target.value })
                            }
                            placeholder={`Train: Parappanangadi / Tirur Station with frequent special festival feeder buses.\nRoad: Direct KSRTC and private buses from Calicut, Malappuram, and Thrissur.`}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <DialogFooter className="gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setEditItem(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Save All Changes"
                    )}
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

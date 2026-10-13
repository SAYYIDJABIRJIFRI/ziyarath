import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listRequestsFn,
  updateRequestStatusFn,
  deleteRequestFn,
  bulkUpdateRequestsFn,
  listAuditFn,
} from "@/lib/requests.functions";
import {
  approveAndCreatePageFn,
  listMaqamsPublicFn,
} from "@/lib/content.functions";
import type { DbMaqam } from "@/types/content";
import { DbHealthPanel } from "@/components/admin/DbHealthPanel";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  RefreshCw,
  ShieldAlert,
  LogOut,
  Trash2,
  Search,
  Download,
  Copy,
  MapPin,
  Calendar,
  Mail,
  Inbox,
  Clock,
  Sparkles,
  Building2,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({
    meta: [
      { title: "Admin — Requests" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRequestsPage,
});

type RequestRow = {
  id: string;
  type: "maqam" | "uroos";
  status: "pending" | "approved" | "rejected";
  name: string;
  contact: string;
  city: string | null;
  country: string | null;
  subject: string;
  requested_date: string | null;
  details: string;
  supporting_notes: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Status = "all" | "pending" | "approved" | "rejected";
type TypeFilter = "all" | "maqam" | "uroos";
type SortKey = "newest" | "oldest" | "name";

function AdminRequestsPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("admin@ziyarath.com");
  const [claiming, setClaiming] = useState(false);
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const listFn = useServerFn(listRequestsFn);
  const updateFn = useServerFn(updateRequestStatusFn);
  const deleteFn = useServerFn(deleteRequestFn);
  const bulkFn = useServerFn(bulkUpdateRequestsFn);
  const auditFn = useServerFn(listAuditFn);
  const approveAndCreateFn = useServerFn(approveAndCreatePageFn);
  const listMaqamsFn = useServerFn(listMaqamsPublicFn);

  const [createModalRow, setCreateModalRow] = useState<RequestRow | null>(null);
  const [createForm, setCreateForm] = useState<any>({});
  const [availableMaqams, setAvailableMaqams] = useState<DbMaqam[]>([]);
  const [creatingPage, setCreatingPage] = useState(false);

  useEffect(() => {
    listMaqamsFn().then((data) => setAvailableMaqams(data as DbMaqam[])).catch(() => {});
  }, [listMaqamsFn]);

  const openCreateModal = (row: RequestRow) => {
    setCreateForm({
      type: row.type,
      titleOrName: row.subject,
      malayalamName: "",
      city: row.city || "Kerala",
      country: row.country || "India",
      description: row.details,
      location: row.city || "",
      category: "scholar",
      region: "kerala",
      isStandalone: false,
      maqamId: availableMaqams.length ? availableMaqams[0].id : "",
      restingPerson: row.name,
      hijriMonth: 1,
      hijriMonthName: "മുഹറം (Muharram)",
      hijriDay: 1,
      gregorianDate: row.requested_date || "Annual",
      programScheduleText: "Daily prayer and Mawlid recitations",
      allotToUserEmail: "",
      reviewNotes: "Approved and created page from user submission",
    });
    setCreateModalRow(row);
  };

  const handleApproveAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModalRow) return;
    setCreatingPage(true);
    try {
      const res = await approveAndCreateFn({
        data: {
          requestId: createModalRow.id,
          type: createModalRow.type,
          reviewerId: "superadmin-system",
          reviewerEmail: "superadmin@ziyarath.com",
          reviewNotes: createForm.reviewNotes,
          allotToUserEmail: createForm.allotToUserEmail,
          data: {
            titleOrName: createForm.titleOrName,
            malayalamName: createForm.malayalamName,
            city: createForm.city,
            country: createForm.country,
            description: createForm.description,
            location: createForm.location,
            category: createForm.category,
            region: createForm.region,
            isStandalone: Boolean(createForm.isStandalone),
            maqamId: createForm.isStandalone ? null : (createForm.maqamId || null),
            restingPerson: createForm.restingPerson,
            hijriMonth: Number(createForm.hijriMonth || 1),
            hijriMonthName: createForm.hijriMonthName,
            hijriDay: Number(createForm.hijriDay || 1),
            gregorianDate: createForm.gregorianDate,
            programScheduleText: createForm.programScheduleText,
          },
        },
      });

      toast.success(
        `Created and published live ${createModalRow.type} page: ${res.createdId}`
      );
      setCreateModalRow(null);
      setSelected(null);
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setCreatingPage(false);
    }
  };

  type AuditRow = {
    id: string;
    action: "approve" | "reject" | "delete";
    request_id: string;
    request_type: string | null;
    request_subject: string | null;
    actor_id: string;
    actor_email: string | null;
    notes: string | null;
    created_at: string;
  };
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await auditFn({ data: { limit: 200 } });
      setAuditRows(data as AuditRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load audit");
    } finally {
      setAuditLoading(false);
    }
  }, [auditFn]);


  // Non-blocking session detection
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));
        const res: any = await Promise.race([sessionPromise, timeoutPromise]);
        if (!mounted) return;
        if (res?.data?.session?.user?.email) {
          setCurrentUserEmail(res.data.session.user.email);
        }
      } catch {
        // Non-blocking
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFn({ data: { status, type: typeFilter } });
      setRows(Array.isArray(data) ? (data as RequestRow[]) : []);
      setCheckedIds(new Set());
    } catch (err) {
      console.error("Failed to load requests", err);
      toast.error(err instanceof Error ? err.message : "Failed to load requests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, typeFilter, listFn]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    const id = setInterval(fetchRows, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchRows, isAdmin]);

  // "/" focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    let out = rows;
    if (needle) {
      out = out.filter((r) =>
        [r.name, r.contact, r.subject, r.details, r.city, r.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    const sorted = [...out];
    if (sort === "newest") {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sort === "oldest") {
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    } else if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [rows, q, sort]);

  const counts = useMemo(() => {
    const base = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      maqam: 0,
      uroos: 0,
      last7: 0,
    };
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    (rows ?? []).forEach((r) => {
      base[r.status] += 1;
      base[r.type] += 1;
      base.total += 1;
      if (new Date(r.created_at).getTime() > weekAgo) base.last7 += 1;
    });
    return base;
  }, [rows]);

  const claimAdmin = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      toast.success("You are now the admin.");
      setIsAdmin(true);
    } else {
      toast.error("An admin already exists. Ask them to grant you access.");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const setStatusFor = async (
    row: RequestRow,
    next: "approved" | "rejected",
    notes?: string,
  ) => {
    setActionLoading(row.id);
    try {
      await updateFn({
        data: {
          id: row.id,
          status: next,
          reviewNotes: notes ?? row.review_notes ?? undefined,
        },
      });
      toast.success(`Marked as ${next}`);
      setSelected(null);
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteRow = async (row: RequestRow) => {
    if (!confirm("Delete this request permanently?")) return;
    setActionLoading(row.id);
    try {
      await deleteFn({ data: { id: row.id } });
      toast.success("Deleted");
      setSelected(null);
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCheck = (id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) return setCheckedIds(new Set());
    setCheckedIds(new Set(filtered.map((r) => r.id)));
  };

  const runBulk = async (action: "approve" | "reject" | "delete") => {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) return;
    const label =
      action === "delete"
        ? `Delete ${ids.length} request(s)? This cannot be undone.`
        : `${action === "approve" ? "Approve" : "Reject"} ${ids.length} request(s)?`;
    if (!confirm(label)) return;
    setLoading(true);
    try {
      const res = (await bulkFn({ data: { ids, action } })) as {
        ok: number;
        total: number;
      };
      toast.success(`${res.ok}/${res.total} updated`);
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) return toast.info("Nothing to export");
    const headers = [
      "id",
      "type",
      "status",
      "name",
      "contact",
      "city",
      "country",
      "subject",
      "requested_date",
      "details",
      "supporting_notes",
      "review_notes",
      "created_at",
    ] as const;
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    };
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        headers.map((h) => escape((r as Record<string, unknown>)[h])).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Copy failed");
    }
  };



  const allVisibleChecked =
    filtered.length > 0 && filtered.every((r) => checkedIds.has(r.id));
  const someChecked = checkedIds.size > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">Requests Queue</h1>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  Review & Publish
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review submissions, approve & create live Maqam or Uroos pages, and allot to Admins.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link to="/admin">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Admin Hub
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm" className="h-8 text-xs">
                  <Link to="/admin/requests">
                    <Inbox className="mr-1.5 h-3.5 w-3.5" /> Requests
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link to="/admin/allotments">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Allotments
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link to="/admin/pages">
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Manage Pages
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={autoRefresh}
                  onCheckedChange={(v) => setAutoRefresh(!!v)}
                />
                Auto-refresh
              </label>
              <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAuditOpen(true);
                  loadAudit();
                }}
              >
                <Clock className="mr-2 h-4 w-4" /> Audit log
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>

          <DbHealthPanel />

          {/* KPI stat cards */}
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Total" value={counts.total} sub={`${counts.last7} this week`} />
            <StatCard
              label="Pending"
              value={counts.pending}
              tone="amber"
              onClick={() => setStatus("pending")}
              active={status === "pending"}
            />
            <StatCard
              label="Approved"
              value={counts.approved}
              tone="emerald"
              onClick={() => setStatus("approved")}
              active={status === "approved"}
            />
            <StatCard
              label="Rejected"
              value={counts.rejected}
              tone="destructive"
              onClick={() => setStatus("rejected")}
              active={status === "rejected"}
            />
          </div>

          {/* Filters */}
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search (press / to focus)…"
                className="pl-9"
                aria-label="Search requests"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger className="w-full sm:w-32" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="maqam">Maqam</SelectItem>
                <SelectItem value="uroos">Uroos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-32" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk action bar */}
          {filtered.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={allVisibleChecked}
                  onCheckedChange={(v) => toggleAllVisible(!!v)}
                  aria-label="Select all visible"
                />
                <span className="text-muted-foreground">
                  {someChecked
                    ? `${checkedIds.size} selected`
                    : `Select all (${filtered.length})`}
                </span>
              </label>
              {someChecked && (
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runBulk("approve")}
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runBulk("reject")}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => runBulk("delete")}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCheckedIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading && !rows ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-50" />
                No requests match the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {filtered.map((r) => {
                const isChecked = checkedIds.has(r.id);
                const location = [r.city, r.country].filter(Boolean).join(", ");
                return (
                  <Card
                    key={r.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      isChecked ? "ring-2 ring-primary/40" : ""
                    }`}
                    onClick={() => {
                      setSelected(r);
                      setReviewNotes(r.review_notes ?? "");
                    }}
                  >
                    <CardContent className="flex items-start gap-3 py-3">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(v) => toggleCheck(r.id, !!v)}
                          aria-label="Select request"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <StatusBadge status={r.status} />
                          <Badge variant="outline" className="capitalize">
                            {r.type}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timeAgo(r.created_at)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {new Date(r.created_at).toLocaleString()}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="truncate font-medium">{r.subject}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="truncate">{r.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copy(r.contact, "Contact copied");
                            }}
                            className="inline-flex max-w-full items-center gap-1 truncate hover:text-foreground"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{r.contact}</span>
                          </button>
                          {location && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {location}
                            </span>
                          )}
                          {r.requested_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              {r.requested_date}
                            </span>
                          )}
                        </div>
                      </div>
                      {r.status === "pending" && (
                        <div
                          className="flex shrink-0 gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setStatusFor(r, "approved")}
                                disabled={actionLoading === r.id}
                                aria-label="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Approve</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setStatusFor(r, "rejected")}
                                disabled={actionLoading === r.id}
                                aria-label="Reject"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reject</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              ← Back to site
            </Link>
          </p>
        </div>

        {/* Detail dialog */}
        <Dialog
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <Badge variant="outline" className="capitalize">
                      {selected.type}
                    </Badge>
                    <span>{selected.subject}</span>
                  </DialogTitle>
                  <DialogDescription>
                    Submitted {new Date(selected.created_at).toLocaleString()} by{" "}
                    {selected.name}
                    <button
                      onClick={() => copy(selected.contact, "Contact copied")}
                      className="ml-2 inline-flex items-center gap-1 underline-offset-2 hover:underline"
                    >
                      {selected.contact} <Copy className="h-3 w-3" />
                    </button>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <dl className="grid grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3 text-sm">
                    <MetaField label="Location">
                      {[selected.city, selected.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </MetaField>
                    <MetaField label="Requested date">
                      {selected.requested_date || "—"}
                    </MetaField>
                  </dl>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Details
                    </p>
                    <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                      {selected.details}
                    </p>
                  </div>
                  {selected.supporting_notes && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Supporting notes
                      </p>
                      <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                        {selected.supporting_notes}
                      </p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="review-notes"
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      Review notes (optional)
                    </label>
                    <Textarea
                      id="review-notes"
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Internal note about this decision"
                    />
                  </div>
                  {selected.reviewed_at && (
                    <p className="text-xs text-muted-foreground">
                      Last reviewed {new Date(selected.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    variant="ghost"
                    onClick={() => deleteRow(selected)}
                    disabled={actionLoading === selected.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                  <div className="flex flex-1 justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setStatusFor(selected, "rejected", reviewNotes)
                      }
                      disabled={actionLoading === selected.id}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setStatusFor(selected, "approved", reviewNotes)
                      }
                      disabled={actionLoading === selected.id}
                    >
                      <Check className="mr-1 h-4 w-4" /> Quick Approve
                    </Button>
                    <Button
                      onClick={() => openCreateModal(selected)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" /> Approve & Create Page
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve and Create Live Page Dialog */}
        <Dialog open={createModalRow !== null} onOpenChange={(o) => !o && setCreateModalRow(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Approve Request & Create Live {createModalRow?.type === "maqam" ? "Maqam" : "Uroos"} Page
              </DialogTitle>
              <DialogDescription>
                Review and finalize page configuration. Creating this will publish an active public page and optionally allot it to an admin.
              </DialogDescription>
            </DialogHeader>

            {createModalRow && (
              <form onSubmit={handleApproveAndCreate} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="cr-title">
                      {createModalRow.type === "maqam" ? "Maqam Name" : "Uroos Title"}
                    </Label>
                    <Input
                      id="cr-title"
                      value={createForm.titleOrName || ""}
                      onChange={(e) => setCreateForm({ ...createForm, titleOrName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cr-mal">Malayalam Title / Name (Optional)</Label>
                    <Input
                      id="cr-mal"
                      value={createForm.malayalamName || ""}
                      onChange={(e) => setCreateForm({ ...createForm, malayalamName: e.target.value })}
                      placeholder="മലയാള നാമം"
                    />
                  </div>
                </div>

                {createModalRow.type === "uroos" ? (
                  <>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <Label className="font-semibold text-primary">Connection Type</Label>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, isStandalone: false })}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            !createForm.isStandalone
                              ? "border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          <Building2 className="h-4 w-4 mb-1 text-emerald-600" />
                          Connect to Maqam
                          <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                            Annual festival held at a sacred Maqam
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, isStandalone: true })}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            createForm.isStandalone
                              ? "border-amber-600 bg-amber-600/10 text-amber-700 dark:text-amber-300 font-semibold"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          <Sparkles className="h-4 w-4 mb-1 text-amber-600" />
                          Standalone Page
                          <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                            Independent festival venue or grounds
                          </span>
                        </button>
                      </div>

                      {!createForm.isStandalone ? (
                        <div className="grid gap-2 pt-1">
                          <Label htmlFor="cr-maqamid" className="text-xs">Select Host Maqam</Label>
                          <select
                            id="cr-maqamid"
                            value={createForm.maqamId || ""}
                            onChange={(e) => setCreateForm({ ...createForm, maqamId: e.target.value })}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            required={!createForm.isStandalone}
                          >
                            <option value="">Select connected Maqam…</option>
                            {availableMaqams.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.city})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid gap-2 pt-1">
                          <Label htmlFor="cr-venue" className="text-xs">Celebration Venue / Grounds</Label>
                          <Input
                            id="cr-venue"
                            value={createForm.venueName || ""}
                            onChange={(e) => setCreateForm({ ...createForm, venueName: e.target.value })}
                            placeholder="e.g. Grand Dargah Ground, Coastal Junction…"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label htmlFor="cr-hday">Hijri Day (1-30)</Label>
                        <Input
                          id="cr-hday"
                          type="number"
                          min={1}
                          max={30}
                          value={createForm.hijriDay || 1}
                          onChange={(e) => setCreateForm({ ...createForm, hijriDay: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="cr-hmonth">Hijri Month Name</Label>
                        <Input
                          id="cr-hmonth"
                          value={createForm.hijriMonthName || ""}
                          onChange={(e) => setCreateForm({ ...createForm, hijriMonthName: e.target.value })}
                          placeholder="e.g. റബീഉൽ അവ്വൽ (Rabi al-Awwal)"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="cr-loc">Location / Mosque</Label>
                      <Input
                        id="cr-loc"
                        value={createForm.location || ""}
                        onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cr-cat">Category</Label>
                      <select
                        id="cr-cat"
                        value={createForm.category || "scholar"}
                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="scholar">Scholar</option>
                        <option value="sufi">Sufi</option>
                        <option value="sahaba">Sahaba</option>
                        <option value="shaheed">Shaheed</option>
                        <option value="prophet">Prophet</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="cr-city">City / District</Label>
                    <Input
                      id="cr-city"
                      value={createForm.city || ""}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cr-country">Country</Label>
                    <Input
                      id="cr-country"
                      value={createForm.country || "India"}
                      onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cr-region">Region</Label>
                    <select
                      id="cr-region"
                      value={createForm.region || "kerala"}
                      onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="kerala">Kerala</option>
                      <option value="india">India</option>
                      <option value="middle-east">Middle East</option>
                      <option value="worldwide">Worldwide</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cr-desc">Description</Label>
                  <Textarea
                    id="cr-desc"
                    rows={4}
                    value={createForm.description || ""}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    required
                  />
                </div>

                {/* Allot Page to Admin Field */}
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-2">
                  <Label htmlFor="cr-allot" className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Allot Page to Admin (Optional)
                  </Label>
                  <Input
                    id="cr-allot"
                    type="email"
                    value={createForm.allotToUserEmail || ""}
                    onChange={(e) => setCreateForm({ ...createForm, allotToUserEmail: e.target.value })}
                    placeholder="Enter Admin email (e.g. caretaker@ziyarath.com)"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    If provided, this page will be allotted immediately to this admin for management.
                  </p>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setCreateModalRow(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingPage} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {creatingPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" /> Approve & Publish Page
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Admin audit log
              </DialogTitle>
              <DialogDescription>
                Approve, reject, and delete actions recorded with the acting
                admin and timestamp. Most recent first (last 200).
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-muted-foreground">
                {auditRows.length} {auditRows.length === 1 ? "entry" : "entries"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAudit}
                disabled={auditLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${auditLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded border">
              {auditLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : auditRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No audit entries yet.
                </div>
              ) : (
                <ul className="divide-y">
                  {auditRows.map((a) => {
                    const when = new Date(a.created_at);
                    const tone =
                      a.action === "approve"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : a.action === "reject"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-red-500/15 text-red-700 dark:text-red-300";
                    return (
                      <li
                        key={a.id}
                        className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${tone} border-transparent`}>
                              {a.action}
                            </Badge>
                            {a.request_type && (
                              <Badge variant="outline">{a.request_type}</Badge>
                            )}
                            <span className="truncate font-medium">
                              {a.request_subject ?? a.request_id}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            by {a.actor_email ?? a.actor_id}
                            {a.notes ? ` — “${a.notes}”` : ""}
                          </div>
                        </div>
                        <div
                          className="text-xs text-muted-foreground"
                          title={when.toISOString()}
                        >
                          {when.toLocaleString()}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAuditOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SiteLayout>
    </TooltipProvider>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  onClick,
  active,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "amber" | "emerald" | "destructive";
  onClick?: () => void;
  active?: boolean;
}) {
  const toneCls =
    tone === "amber"
      ? "text-amber-700 dark:text-amber-400"
      : tone === "emerald"
        ? "text-emerald-700 dark:text-emerald-400"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`rounded-lg border bg-card p-3 text-left transition-colors ${
        onClick ? "hover:bg-accent/50" : ""
      } ${active ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneCls}`}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
      )}
    </Comp>
  );
}

function StatusBadge({ status }: { status: RequestRow["status"] }) {
  const cls =
    status === "approved"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

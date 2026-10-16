import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Sparkles,
  UserCheck,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  Inbox,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  listAllotmentsFn,
  createAllotmentFn,
  revokeAllotmentFn,
  listSystemUsersFn,
  listMaqamsPublicFn,
  listUroosPublicFn,
} from "@/lib/content.functions";
import { useServerFn } from "@tanstack/react-start";
import type { PageAllotment, SystemUser, DbMaqam, DbUroos } from "@/types/content";

export const Route = createFileRoute("/admin/allotments")({
  head: () => ({
    meta: [
      { title: "Super Admin — Page Allotments" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAllotmentsPage,
});

function AdminAllotmentsPage() {
  const navigate = useNavigate();
  const [allotments, setAllotments] = useState<PageAllotment[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [maqams, setMaqams] = useState<DbMaqam[]>([]);
  const [uroosList, setUroosList] = useState<DbUroos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "maqam" | "uroos">("all");

  // New Allotment Modal State
  const [openModal, setOpenModal] = useState(false);
  const [targetType, setTargetType] = useState<"maqam" | "uroos">("maqam");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Server functions
  const listAllotFn = useServerFn(listAllotmentsFn);
  const createAllotFn = useServerFn(createAllotmentFn);
  const revokeAllotFn = useServerFn(revokeAllotmentFn);
  const listUsersFn = useServerFn(listSystemUsersFn);
  const listMaqamsFn = useServerFn(listMaqamsPublicFn);
  const listUroosFn = useServerFn(listUroosPublicFn);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [allotData, usersData, maqamsData, uroosData] = await Promise.all([
        listAllotFn(),
        listUsersFn(),
        listMaqamsFn(),
        listUroosFn(),
      ]);
      setAllotments(allotData as PageAllotment[]);
      setSystemUsers(usersData as SystemUser[]);
      setMaqams(maqamsData as DbMaqam[]);
      setUroosList(uroosData as DbUroos[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load allotments");
    } finally {
      setLoading(false);
    }
  };

  const [currentUserEmail, setCurrentUserEmail] = useState("superadmin@ziyarath.com");

  // Session detection & Super Admin restriction
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));
        const res: any = await Promise.race([sessionPromise, timeoutPromise]);
        if (!mounted) return;
        const userObj = res?.data?.session?.user;
        const email = userObj?.email;
        if (email) {
          setCurrentUserEmail(email);
          const metaRole = userObj?.app_metadata?.role || userObj?.user_metadata?.role;
          const isSuper = email.toLowerCase().includes("superadmin") || metaRole === "super_admin";
          if (!isSuper) {
            toast.error("Allotments management is only for Super Admins. Redirected to /admin/pages.");
            navigate({ to: "/admin/pages" });
          }
        }
      } catch {
        // Non-blocking
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, []);

  // Filter allotments
  const filtered = useMemo(() => {
    return allotments.filter((a) => {
      if (typeFilter !== "all" && a.targetType !== typeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.targetTitle.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
      );
    });
  }, [allotments, typeFilter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      toast.error("Please select a Maqam or Uroos page.");
      return;
    }
    if (!userEmail.trim()) {
      toast.error("Please specify the Admin email to allot this page to.");
      return;
    }

    let targetTitle = "";
    if (targetType === "maqam") {
      const m = maqams.find((x) => x.id === selectedTargetId);
      targetTitle = m ? m.name : selectedTargetId;
    } else {
      const u = uroosList.find((x) => x.id === selectedTargetId);
      targetTitle = u ? u.title : selectedTargetId;
    }

    setSubmitting(true);
    try {
      await createAllotFn({
        data: {
          userId: `usr-${userEmail.trim().replace(/[^a-z0-9]/gi, "")}`,
          userEmail: userEmail.trim(),
          targetType,
          targetId: selectedTargetId,
          targetTitle,
          assignedBy: "superadmin-system",
          assignedByEmail: currentUserEmail,
          notes: notes.trim() || undefined,
        },
      });
      toast.success(`Successfully allotted "${targetTitle}" to ${userEmail.trim()}`);
      setOpenModal(false);
      setUserEmail("");
      setSelectedTargetId("");
      setNotes("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create allotment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (a: PageAllotment) => {
    if (!confirm(`Revoke allotment of "${a.targetTitle}" from ${a.userEmail}?`)) return;
    try {
      await revokeAllotFn({ data: { id: a.id } });
      toast.success("Allotment revoked");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    }
  };

  const isSuperAdmin = currentUserEmail.toLowerCase().includes("superadmin");

  if (!isSuperAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <Card className="p-8 border-dashed shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <Badge className="mb-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
              Super Admin Access Only
            </Badge>
            <h2 className="text-xl font-bold text-foreground">
              Page Allotments is Restricted
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Allotting pages and managing administrative assignments is restricted to <strong>Super Admins</strong>. As a Page Admin ({currentUserEmail}), you can only access and edit your allotted pages.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/admin/pages">
                  Go to My Allotted Pages
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Header Sub-Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Super Admin Allotments
                </h1>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  Super Admin Control
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Allot Maqam and Uroos pages to designated caretaker admins for maintenance and updates.
              </p>
            </div>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Admin Hub
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/requests">
                <Inbox className="mr-1.5 h-4 w-4" />
                Requests Queue
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/pages">
                <FileText className="mr-1.5 h-4 w-4" />
                Page Management
              </Link>
            </Button>
            <Button size="sm" onClick={() => setOpenModal(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" /> Allot Page to Admin
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Total Allotments
            </span>
            <span className="text-2xl font-extrabold text-foreground mt-1 block">
              {allotments.length}
            </span>
          </Card>
          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Maqams Allotted
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {allotments.filter((a) => a.targetType === "maqam").length}
            </span>
          </Card>
          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Uroos Allotted
            </span>
            <span className="text-2xl font-extrabold text-primary mt-1 block">
              {allotments.filter((a) => a.targetType === "uroos").length}
            </span>
          </Card>
          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Unique Admins
            </span>
            <span className="text-2xl font-extrabold text-foreground mt-1 block">
              {new Set(allotments.map((a) => a.userEmail)).size}
            </span>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by page title, admin email, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                All ({allotments.length})
              </button>
              <button
                onClick={() => setTypeFilter("maqam")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "maqam" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Maqams
              </button>
              <button
                onClick={() => setTypeFilter("uroos")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === "uroos" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Uroos
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Allotments Table */}
        <Card className="overflow-hidden border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5">Allotted Page</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Assigned Admin</th>
                  <th className="px-4 py-3.5">Assigned Date</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading allotments…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No page allotments found. Use "Allot Page to Admin" above to assign pages.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const isMaqam = a.targetType === "maqam";
                    return (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {a.targetTitle}
                            </span>
                            <Link
                              to={isMaqam ? "/maqam/$id" : "/uroos/$id"}
                              params={{ id: a.targetId }}
                              target="_blank"
                              className="text-muted-foreground hover:text-primary"
                              title="View live public page"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ID: {a.targetId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {isMaqam ? (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-xs">
                              <Building2 className="mr-1 h-3 w-3" /> Maqam
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5 text-xs">
                              <Sparkles className="mr-1 h-3 w-3" /> Uroos
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            {a.userEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                          {a.notes || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(a)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2 text-xs"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Revoke
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Allotment Dialog */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Allot Page to Admin
              </DialogTitle>
              <DialogDescription>
                Grant an Admin user authorization to manage and update a specific Maqam or Uroos page.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Page Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("maqam");
                      setSelectedTargetId("");
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium text-xs transition-all ${
                      targetType === "maqam"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-input bg-background text-muted-foreground"
                    }`}
                  >
                    <Building2 className="inline mr-1 h-3.5 w-3.5" />
                    Maqam Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("uroos");
                      setSelectedTargetId("");
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium text-xs transition-all ${
                      targetType === "uroos"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-input bg-background text-muted-foreground"
                    }`}
                  >
                    <Sparkles className="inline mr-1 h-3.5 w-3.5" />
                    Uroos Page
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="allot-target">
                  Select {targetType === "maqam" ? "Maqam" : "Uroos"} Page
                </Label>
                <select
                  id="allot-target"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select a page…</option>
                  {targetType === "maqam"
                    ? maqams.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.city})
                        </option>
                      ))
                    : uroosList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.title} ({u.city})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="allot-email">Admin User Email</Label>
                <Input
                  id="allot-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. caretaker@ziyarath.com or admin@..."
                  required
                />
                {systemUsers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>Quick pick:</span>
                    {systemUsers.map((su) => (
                      <button
                        key={su.id}
                        type="button"
                        onClick={() => setUserEmail(su.userEmail)}
                        className="underline hover:text-primary"
                      >
                        {su.userEmail}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="allot-notes">Assignment Notes (Optional)</Label>
                <Input
                  id="allot-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Authorized local trust committee caretaker"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submitting ? "Saving…" : "Save Allotment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
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
import {
  listSubdomainMappingsFn,
  assignSubdomainFn,
  removeSubdomainFn,
} from "@/lib/subdomain.functions";
import { ROOT_DOMAIN } from "@/lib/subdomain-config";
import { useServerFn } from "@tanstack/react-start";
import type { PageAllotment, SystemUser, DbMaqam, DbUroos, SubdomainMapping } from "@/types/content";
import { checkIsSuperAdmin } from "@/lib/auth-roles";

export const Route = createFileRoute("/admin/allotments")({
  head: () => ({
    meta: [
      { title: "Super Admin — Allotments & Subdomains | Ziyarath" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAllotmentsPage,
});

function AdminAllotmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"allotments" | "subdomains">("allotments");

  // Allotments State
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

  // Subdomain State
  const [subdomains, setSubdomains] = useState<SubdomainMapping[]>([]);
  const [subdomainLoading, setSubdomainLoading] = useState(false);
  const [subdomainSearch, setSubdomainSearch] = useState("");
  const [subdomainTypeFilter, setSubdomainTypeFilter] = useState<"all" | "maqam" | "uroos">("all");

  // New Subdomain Modal State
  const [openSubdomainModal, setOpenSubdomainModal] = useState(false);
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainTargetType, setSubdomainTargetType] = useState<"maqam" | "uroos">("maqam");
  const [subdomainSelectedTargetId, setSubdomainSelectedTargetId] = useState("");
  const [subdomainNotes, setSubdomainNotes] = useState("");
  const [subdomainSubmitting, setSubdomainSubmitting] = useState(false);

  // Subdomain Revoke Modal State
  const [subdomainToDelete, setSubdomainToDelete] = useState<SubdomainMapping | null>(null);
  const [deletingSubdomain, setDeletingSubdomain] = useState(false);

  // Server functions
  const listAllotFn = useServerFn(listAllotmentsFn);
  const createAllotFn = useServerFn(createAllotmentFn);
  const revokeAllotFn = useServerFn(revokeAllotmentFn);
  const listUsersFn = useServerFn(listSystemUsersFn);
  const listMaqamsFn = useServerFn(listMaqamsPublicFn);
  const listUroosFn = useServerFn(listUroosPublicFn);

  const listSubdomainsFn = useServerFn(listSubdomainMappingsFn);
  const assignSubFn = useServerFn(assignSubdomainFn);
  const removeSubFn = useServerFn(removeSubdomainFn);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [allotData, usersData, maqamsData, uroosData, subData] = await Promise.all([
        listAllotFn(),
        listUsersFn(),
        listMaqamsFn(),
        listUroosFn(),
        listSubdomainsFn(),
      ]);
      setAllotments(allotData as PageAllotment[]);
      setSystemUsers(usersData as SystemUser[]);
      setMaqams(maqamsData as DbMaqam[]);
      setUroosList(uroosData as DbUroos[]);
      setSubdomains(subData as SubdomainMapping[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load management data");
    } finally {
      setLoading(false);
    }
  };

  const loadSubdomains = async () => {
    setSubdomainLoading(true);
    try {
      const data = await listSubdomainsFn();
      setSubdomains(data as SubdomainMapping[]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to refresh subdomains");
    } finally {
      setSubdomainLoading(false);
    }
  };

  const [currentUserEmail, setCurrentUserEmail] = useState("superadmin@ziyarath.com");
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);

  // Session detection & Super Admin restriction
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        let email = "superadmin@ziyarath.com";
        let role = "super_admin";
        let userMeta: any = null;

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));
        const res: any = await Promise.race([sessionPromise, timeoutPromise]);
        if (!mounted) return;
        const userObj = res?.data?.session?.user;
        if (userObj?.email) {
          email = userObj.email;
          role = userObj.app_metadata?.role || userObj.user_metadata?.role || "admin";
          userMeta = userObj;
        } else if (typeof window !== "undefined") {
          const stored = localStorage.getItem("ziyarath_mock_user");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.email) email = parsed.email;
              if (parsed.role) role = parsed.role;
            } catch {}
          }
        }

        if (!mounted) return;
        setCurrentUserEmail(email);
        const isSuper = checkIsSuperAdmin(email, role, userMeta);
        setIsSuperAdmin(isSuper);
        if (!isSuper) {
          toast.error("Allotments & Subdomains management is only for Super Admins. Redirected to /admin/pages.");
          navigate({ to: "/admin/pages" });
        }
      } catch {
        // Non-blocking
      }
    };
    check();

    const onAuthUpdate = () => {
      check();
    };
    window.addEventListener("ziyarath-auth-update", onAuthUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("ziyarath-auth-update", onAuthUpdate);
    };
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, []);

  // Filter allotments
  const filteredAllotments = useMemo(() => {
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

  // Filter subdomains
  const filteredSubdomains = useMemo(() => {
    return subdomains.filter((s) => {
      if (subdomainTypeFilter !== "all" && s.targetType !== subdomainTypeFilter) return false;
      if (!subdomainSearch.trim()) return true;
      const q = subdomainSearch.toLowerCase();
      return (
        s.subdomain.toLowerCase().includes(q) ||
        s.targetTitle.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    });
  }, [subdomains, subdomainTypeFilter, subdomainSearch]);

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
          assignedBy: currentUserEmail,
          assignedByEmail: currentUserEmail,
          assignedByRole: "super_admin",
          notes: notes.trim() || undefined,
        },
      });

      toast.success(`Successfully allotted "${targetTitle}" to ${userEmail.trim()}!`);
      setOpenModal(false);
      setSelectedTargetId("");
      setUserEmail("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to allot page");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (allotment: PageAllotment) => {
    if (
      !confirm(
        `Revoke allotment of "${allotment.targetTitle}" from ${allotment.userEmail}? They will no longer be able to edit this page.`
      )
    ) {
      return;
    }

    try {
      await revokeAllotFn({
        data: {
          id: allotment.id,
          requesterId: currentUserEmail,
          requesterEmail: currentUserEmail,
          requesterRole: "super_admin",
        },
      });
      toast.success(`Allotment for "${allotment.targetTitle}" revoked.`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke allotment");
    }
  };

  // Subdomain Handlers
  const handleAssignSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSub = subdomainInput
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\.ziyarath\.com.*$/i, "")
      .replace(/[^a-z0-9-]/g, "");

    if (!cleanSub || cleanSub.length < 2) {
      toast.error("Subdomain must be at least 2 characters long.");
      return;
    }
    if (!subdomainSelectedTargetId) {
      toast.error("Please select a target Maqam or Uroos page.");
      return;
    }

    setSubdomainSubmitting(true);
    try {
      const res = await assignSubFn({
        data: {
          subdomain: cleanSub,
          targetType: subdomainTargetType,
          targetId: subdomainSelectedTargetId,
          notes: subdomainNotes.trim() || undefined,
          assignedBy: currentUserEmail,
          assignedByEmail: currentUserEmail,
          assignedByRole: "super_admin",
        },
      });

      toast.success(
        `Subdomain "${res.mapping.subdomain}.${ROOT_DOMAIN}" successfully assigned to "${res.mapping.targetTitle}"!`
      );
      setOpenSubdomainModal(false);
      setSubdomainInput("");
      setSubdomainSelectedTargetId("");
      setSubdomainNotes("");
      await loadSubdomains();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign subdomain.");
    } finally {
      setSubdomainSubmitting(false);
    }
  };

  const handleRemoveSubdomain = async () => {
    if (!subdomainToDelete) return;
    setDeletingSubdomain(true);
    try {
      await removeSubFn({
        data: {
          subdomain: subdomainToDelete.subdomain,
          removerId: currentUserEmail,
          removerEmail: currentUserEmail,
          removerRole: "super_admin",
        },
      });
      toast.success(`Subdomain "${subdomainToDelete.subdomain}.${ROOT_DOMAIN}" removed.`);
      setSubdomainToDelete(null);
      await loadSubdomains();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove subdomain.");
    } finally {
      setDeletingSubdomain(false);
    }
  };

  // Detected connected page info for subdomain modal
  const detectedConnectedInfo = useMemo(() => {
    if (!subdomainSelectedTargetId) return null;
    if (subdomainTargetType === "maqam") {
      const connected = uroosList.find((u) => u.maqamId === subdomainSelectedTargetId);
      if (connected) {
        return {
          type: "uroos" as const,
          title: connected.title,
          id: connected.id,
          note: `Visiting https://${subdomainInput || "..."}.${ROOT_DOMAIN}/uroos will automatically open ${connected.title}.`,
        };
      }
    } else {
      const u = uroosList.find((x) => x.id === subdomainSelectedTargetId);
      if (u?.maqamId) {
        const connectedMaqam = maqams.find((m) => m.id === u.maqamId);
        if (connectedMaqam) {
          return {
            type: "maqam" as const,
            title: connectedMaqam.name,
            id: connectedMaqam.id,
            note: `Visiting https://${subdomainInput || "..."}.${ROOT_DOMAIN}/maqam will automatically open ${connectedMaqam.name}.`,
          };
        }
      }
    }
  }, [subdomainSelectedTargetId, subdomainTargetType, subdomainInput, maqams, uroosList]);

  // Helper to find subdomain for a specific target page
  const getSubdomainForTarget = (type: "maqam" | "uroos", id: string) => {
    return (
      subdomains.find(
        (s) =>
          (type === "maqam" && (s.maqamId === id || s.targetId === id)) ||
          (type === "uroos" && (s.uroosId === id || s.targetId === id))
      ) || null
    );
  };

  // Check if the typed subdomain is already set for another page
  const existingSubdomainForSlug = useMemo(() => {
    const slug = subdomainInput
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\.ziyarath\.com.*$/i, "")
      .replace(/[^a-z0-9-]/g, "");
    if (!slug) return null;
    return subdomains.find((s) => s.subdomain === slug) || null;
  }, [subdomainInput, subdomains]);

  // Check if currently selected page already has a subdomain assigned
  const existingSubdomainForSelectedPage = useMemo(() => {
    if (!subdomainSelectedTargetId) return null;
    return getSubdomainForTarget(subdomainTargetType, subdomainSelectedTargetId);
  }, [subdomainSelectedTargetId, subdomainTargetType, subdomains]);

  if (!isSuperAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Card className="p-8 border-destructive/30">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-3" />
            <h2 className="text-xl font-bold text-foreground">Super Admin Access Required</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Allotments and Subdomain routing are reserved strictly for Chief Administrators.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/admin/pages">Go to My Allotted Pages</Link>
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
                  Super Admin Governance
                </h1>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  Super Admin Control
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage caretaker page allotments and assign custom subdomains to Maqam & Uroos pages.
              </p>
            </div>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex flex-wrap items-center gap-2">
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

            {activeTab === "allotments" ? (
              <Button
                size="sm"
                onClick={() => setOpenModal(true)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Plus className="h-4 w-4" /> Allot Page to Admin
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setOpenSubdomainModal(true)}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Globe className="h-4 w-4" /> Assign Subdomain
              </Button>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-1">
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="allotments" className="gap-2 text-xs sm:text-sm">
                <UserCheck className="h-4 w-4" />
                Page Allotments
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {allotments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="subdomains" className="gap-2 text-xs sm:text-sm">
                <Globe className="h-4 w-4 text-primary" />
                Subdomain Routing
                <Badge className="ml-1 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                  {subdomains.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <Button
              variant="ghost"
              size="sm"
              onClick={activeTab === "allotments" ? loadData : loadSubdomains}
              className="text-xs text-muted-foreground gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || subdomainLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: PAGE ALLOTMENTS                                          */}
          {/* ============================================================== */}
          <TabsContent value="allotments" className="space-y-6 mt-0">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Total Allotments
                </span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">
                  {allotments.length}
                </span>
              </Card>
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Maqams Allotted
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {allotments.filter((a) => a.targetType === "maqam").length}
                </span>
              </Card>
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Uroos Allotted
                </span>
                <span className="text-2xl font-extrabold text-primary mt-1 block">
                  {allotments.filter((a) => a.targetType === "uroos").length}
                </span>
              </Card>
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Unique Admins
                </span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">
                  {new Set(allotments.map((a) => a.userEmail)).size}
                </span>
              </Card>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by page name, admin email, or notes…"
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-input p-0.5 bg-background">
                  <button
                    type="button"
                    onClick={() => setTypeFilter("all")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      typeFilter === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({allotments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("maqam")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      typeFilter === "maqam"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Maqams ({allotments.filter((a) => a.targetType === "maqam").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("uroos")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      typeFilter === "uroos"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Uroos ({allotments.filter((a) => a.targetType === "uroos").length})
                  </button>
                </div>
              </div>
            </div>

            {/* Allotments Table */}
            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Target Page</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Allotted Admin</th>
                      <th className="px-4 py-3 font-semibold">Notes & Context</th>
                      <th className="px-4 py-3 font-semibold">Allotted By</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                          Loading page allotments…
                        </td>
                      </tr>
                    ) : filteredAllotments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          <UserCheck className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                          <p className="font-medium text-foreground">No allotments found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {search ? "Try adjusting your search query." : "Allot a page to an admin to get started."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredAllotments.map((allotment) => (
                        <tr key={allotment.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {allotment.targetType === "maqam" ? (
                                  <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <span>{allotment.targetTitle}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                                  {allotment.targetId}
                                </Badge>
                              </div>
                              {(() => {
                                const sub = getSubdomainForTarget(allotment.targetType, allotment.targetId);
                                if (!sub) return null;
                                return (
                                  <div className="flex items-center gap-1.5 pl-6">
                                    <a
                                      href={`https://${sub.subdomain}.${ROOT_DOMAIN}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors"
                                      title={`Live at https://${sub.subdomain}.${ROOT_DOMAIN}`}
                                    >
                                      <Globe className="h-2.5 w-2.5" />
                                      {sub.subdomain}.{ROOT_DOMAIN}
                                    </a>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`text-[10px] uppercase font-semibold ${
                                allotment.targetType === "maqam"
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : "bg-primary/20 text-primary border-primary/30"
                              }`}
                            >
                              {allotment.targetType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground text-xs">{allotment.userEmail}</div>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {allotment.userId}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                            {allotment.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <div>{allotment.assignedByEmail || allotment.assignedBy}</div>
                            <div className="text-[10px]">
                              {new Date(allotment.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs">
                                <a
                                  href={allotment.targetType === "maqam" ? `/maqam/${allotment.targetId}` : `/uroos/${allotment.targetId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevoke(allotment)}
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Revoke page access"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ============================================================== */}
          {/* TAB 2: SUBDOMAIN ROUTING (SUPER ADMIN ONLY)                     */}
          {/* ============================================================== */}
          <TabsContent value="subdomains" className="space-y-6 mt-0">
            {/* Subdomain Metrics */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Active Subdomains
                </span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">
                  {subdomains.length}
                </span>
              </Card>
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Maqam Subdomains
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {subdomains.filter((s) => s.targetType === "maqam").length}
                </span>
              </Card>
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Uroos Subdomains
                </span>
                <span className="text-2xl font-extrabold text-primary mt-1 block">
                  {subdomains.filter((s) => s.targetType === "uroos").length}
                </span>
              </Card>
              <Card className="p-4 bg-card/60 border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Root Domain
                </span>
                <span className="text-lg font-bold text-foreground mt-1 block truncate font-mono">
                  {ROOT_DOMAIN}
                </span>
              </Card>
            </div>

            {/* Architecture Explainer Card */}
            <Card className="p-4 sm:p-5 bg-gradient-to-r from-primary/10 via-card to-background border-primary/20">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Dynamic Subdomain Architecture & Canonical Routing
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      Cloudflare D1 Backed
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Super Admins can assign dedicated subdomains (such as <code className="text-primary font-mono font-semibold">madavoor.{ROOT_DOMAIN}</code> or <code className="text-primary font-mono font-semibold">ajmer.{ROOT_DOMAIN}</code>) directly to any Maqam or Uroos page. The backend automatically handles SSR rewrites, 301 canonical redirects, and multi-page routing (e.g. serving connected Uroos at <code className="text-primary font-mono font-semibold">/{'{subdomain}'}.{ROOT_DOMAIN}/uroos</code>) with zero extra DNS setup.
                  </p>
                </div>
              </div>
            </Card>

            {/* Search and Filter for Subdomains */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={subdomainSearch}
                  onChange={(e) => setSubdomainSearch(e.target.value)}
                  placeholder="Search subdomains, target pages, notes…"
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-input p-0.5 bg-background">
                  <button
                    type="button"
                    onClick={() => setSubdomainTypeFilter("all")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      subdomainTypeFilter === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({subdomains.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubdomainTypeFilter("maqam")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      subdomainTypeFilter === "maqam"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Maqams ({subdomains.filter((s) => s.targetType === "maqam").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubdomainTypeFilter("uroos")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      subdomainTypeFilter === "uroos"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Uroos ({subdomains.filter((s) => s.targetType === "uroos").length})
                  </button>
                </div>
              </div>
            </div>

            {/* Subdomain Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subdomainLoading ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                  Loading assigned subdomains…
                </div>
              ) : filteredSubdomains.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Globe className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="font-medium text-foreground">No subdomains found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {subdomainSearch ? "Try adjusting your search filter." : "Click 'Assign Subdomain' to create your first dynamic subdomain."}
                  </p>
                </div>
              ) : (
                filteredSubdomains.map((sub) => {
                  const liveUrl = `https://${sub.subdomain}.${ROOT_DOMAIN}`;
                  return (
                    <Card key={sub.subdomain} className="group border-border bg-card/80 hover:border-primary/40 transition-all flex flex-col justify-between">
                      <CardHeader className="p-4 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-mono font-bold text-sm text-foreground">
                                {sub.subdomain}.{ROOT_DOMAIN}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5 block">
                              Assigned {new Date(sub.createdAt).toLocaleDateString()} by {sub.assignedByEmail || sub.assignedBy}
                            </span>
                          </div>

                          <Badge
                            className={`text-[10px] uppercase font-semibold ${
                              sub.targetType === "maqam"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-primary/20 text-primary border-primary/30"
                            }`}
                          >
                            {sub.targetType}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            {sub.targetType === "maqam" ? (
                              <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                            <span className="truncate">{sub.targetTitle}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            ID: {sub.targetId}
                          </div>

                          {/* Connected item preview */}
                          {sub.targetType === "maqam" && sub.uroosId && (
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-primary flex items-center gap-1">
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span className="truncate">Connected Uroos: {sub.uroosId}</span>
                            </div>
                          )}
                          {sub.targetType === "uroos" && sub.maqamId && (
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-emerald-600 flex items-center gap-1">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">Connected Maqam: {sub.maqamId}</span>
                            </div>
                          )}
                        </div>

                        {sub.notes && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            "{sub.notes}"
                          </p>
                        )}

                        <div className="pt-2 flex items-center justify-between border-t border-border/40">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                          >
                            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Visit Subdomain
                            </a>
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSubdomainInput(sub.subdomain);
                                setSubdomainTargetType(sub.targetType);
                                setSubdomainSelectedTargetId(sub.targetId);
                                setSubdomainNotes(sub.notes || "");
                                setOpenSubdomainModal(true);
                              }}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSubdomainToDelete(sub)}
                              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ============================================================== */}
        {/* MODAL 1: CREATE ALLOTMENT DIALOG                               */}
        {/* ============================================================== */}
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
                    ? maqams.map((m) => {
                        const sub = getSubdomainForTarget("maqam", m.id);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.city}){sub ? ` — [🌐 ${sub.subdomain}.${ROOT_DOMAIN}]` : ""}
                          </option>
                        );
                      })
                    : uroosList.map((u) => {
                        const sub = getSubdomainForTarget("uroos", u.id);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.title} ({u.city}){sub ? ` — [🌐 ${sub.subdomain}.${ROOT_DOMAIN}]` : ""}
                          </option>
                        );
                      })}
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
                        title={`${su.displayName} (${su.allotmentCount ?? 0} allotted)`}
                      >
                        {su.userEmail} ({su.allotmentCount ?? 0})
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

        {/* ============================================================== */}
        {/* MODAL 2: ASSIGN SUBDOMAIN DIALOG (SUPER ADMIN ONLY)            */}
        {/* ============================================================== */}
        <Dialog open={openSubdomainModal} onOpenChange={setOpenSubdomainModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Assign Subdomain
              </DialogTitle>
              <DialogDescription>
                Assign a dedicated subdomain on <span className="font-semibold text-foreground font-mono">{ROOT_DOMAIN}</span> to any Maqam or Uroos page.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAssignSubdomain} className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="subdomain-slug">Subdomain Prefix</Label>
                <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-primary">
                  <span className="pl-3 text-xs text-muted-foreground font-mono select-none">https://</span>
                  <Input
                    id="subdomain-slug"
                    value={subdomainInput}
                    onChange={(e) =>
                      setSubdomainInput(
                        e.target.value
                          .toLowerCase()
                          .replace(/^https?:\/\//i, "")
                          .replace(/\.ziyarath\.com.*$/i, "")
                          .replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    placeholder="madavoor"
                    className="border-0 shadow-none focus-visible:ring-0 font-mono text-sm px-1.5"
                    required
                  />
                  <span className="pr-3 text-xs text-primary font-mono font-bold select-none">
                    .{ROOT_DOMAIN}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens (e.g. <code className="text-primary font-semibold">madavoor</code>, <code className="text-primary font-semibold">ajmer</code>, <code className="text-primary font-semibold">kondotty</code>).
                </p>

                {/* Real-time Subdomain Collision / Already-Set Status */}
                {subdomainInput && existingSubdomainForSlug && (
                  <div
                    className={`rounded-md p-2.5 text-xs flex items-start gap-2 border ${
                      existingSubdomainForSlug.targetId === subdomainSelectedTargetId
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {existingSubdomainForSlug.targetId === subdomainSelectedTargetId ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    )}
                    <div>
                      {existingSubdomainForSlug.targetId === subdomainSelectedTargetId ? (
                        <span>
                          <strong>Already assigned to this page:</strong> Submitting will update its routing notes.
                        </span>
                      ) : (
                        <span>
                          <strong>⚠️ Subdomain already set!</strong> Currently assigned to{" "}
                          <strong>"{existingSubdomainForSlug.targetTitle}"</strong> ({existingSubdomainForSlug.targetType}). Saving will overwrite and re-assign{" "}
                          <code className="font-mono font-bold">https://{existingSubdomainForSlug.subdomain}.{ROOT_DOMAIN}</code> to this page!
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {subdomainInput && !existingSubdomainForSlug && subdomainInput.length >= 2 && (
                  <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Subdomain <strong>{subdomainInput}.{ROOT_DOMAIN}</strong> is available to assign!</span>
                  </div>
                )}
              </div>

              {/* Real-time Subdomain Live Preview Card */}
              {subdomainInput && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                    Subdomain Routing Preview
                  </span>
                  <div className="font-mono text-sm font-bold text-foreground">
                    https://{subdomainInput}.{ROOT_DOMAIN}
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-2">
                    <span>Direct paths:</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      /{subdomainTargetType}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Target Page Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubdomainTargetType("maqam");
                      setSubdomainSelectedTargetId("");
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium text-xs transition-all ${
                      subdomainTargetType === "maqam"
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
                      setSubdomainTargetType("uroos");
                      setSubdomainSelectedTargetId("");
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium text-xs transition-all ${
                      subdomainTargetType === "uroos"
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
                <Label htmlFor="subdomain-target">
                  Select {subdomainTargetType === "maqam" ? "Maqam" : "Uroos"} Page
                </Label>
                <select
                  id="subdomain-target"
                  value={subdomainSelectedTargetId}
                  onChange={(e) => setSubdomainSelectedTargetId(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select a page to map…</option>
                  {subdomainTargetType === "maqam"
                    ? maqams.map((m) => {
                        const existing = getSubdomainForTarget("maqam", m.id);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.city}, {m.region}){existing ? ` — [🌐 ${existing.subdomain}.${ROOT_DOMAIN}]` : ""}
                          </option>
                        );
                      })
                    : uroosList.map((u) => {
                        const existing = getSubdomainForTarget("uroos", u.id);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.title} ({u.city}){existing ? ` — [🌐 ${existing.subdomain}.${ROOT_DOMAIN}]` : ""}
                          </option>
                        );
                      })}
                </select>

                {/* If selected page already has a subdomain assigned */}
                {existingSubdomainForSelectedPage && (
                  <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold">Page Already Has Subdomain: </span>
                        <a
                          href={`https://${existingSubdomainForSelectedPage.subdomain}.${ROOT_DOMAIN}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono underline font-bold"
                        >
                          https://{existingSubdomainForSelectedPage.subdomain}.{ROOT_DOMAIN}
                        </a>
                      </div>
                    </div>
                    {subdomainInput !== existingSubdomainForSelectedPage.subdomain && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20"
                        onClick={() => {
                          setSubdomainInput(existingSubdomainForSelectedPage.subdomain);
                          if (existingSubdomainForSelectedPage.notes) {
                            setSubdomainNotes(existingSubdomainForSelectedPage.notes);
                          }
                        }}
                      >
                        Load Prefix ({existingSubdomainForSelectedPage.subdomain})
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Auto-detected connected link preview */}
              {detectedConnectedInfo && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Auto-Linked Companion Page: </span>
                    {detectedConnectedInfo.note}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="subdomain-notes">Administrative Notes (Optional)</Label>
                <Input
                  id="subdomain-notes"
                  value={subdomainNotes}
                  onChange={(e) => setSubdomainNotes(e.target.value)}
                  placeholder="e.g. Official dedicated portal for Madavoor Sharif"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpenSubdomainModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={subdomainSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                >
                  {subdomainSubmitting ? "Assigning…" : "Save Subdomain"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ============================================================== */}
        {/* MODAL 3: DELETE SUBDOMAIN CONFIRMATION DIALOG                  */}
        {/* ============================================================== */}
        <Dialog open={!!subdomainToDelete} onOpenChange={(open) => !open && setSubdomainToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Remove Subdomain Mapping
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove the subdomain{" "}
                <span className="font-mono font-bold text-foreground">
                  {subdomainToDelete?.subdomain}.{ROOT_DOMAIN}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg bg-muted/60 p-3 border border-border text-xs space-y-1">
              <div className="font-medium text-foreground">
                Target: {subdomainToDelete?.targetTitle} ({subdomainToDelete?.targetType})
              </div>
              <p className="text-muted-foreground">
                Once removed, visitors will access this page via the standard path{" "}
                <code className="text-primary font-mono">
                  /{subdomainToDelete?.targetType}/{subdomainToDelete?.targetId}
                </code>
                .
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSubdomainToDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deletingSubdomain}
                onClick={handleRemoveSubdomain}
              >
                {deletingSubdomain ? "Removing…" : "Yes, Remove Subdomain"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}

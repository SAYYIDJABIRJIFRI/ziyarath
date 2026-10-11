import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Building2,
  Sparkles,
  Inbox,
  UserCheck,
  Edit,
  ArrowRight,
  ExternalLink,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Landmark,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAllotmentsFn,
  listMaqamsPublicFn,
  listUroosPublicFn,
} from "@/lib/content.functions";
import { listRequestsFn } from "@/lib/requests.functions";
import type { PageAllotment, DbMaqam, DbUroos } from "@/types/content";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Ziyarath" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHubPage,
});

function AdminHubPage() {
  const [loading, setLoading] = useState(true);
  const [maqams, setMaqams] = useState<DbMaqam[]>([]);
  const [uroosList, setUroosList] = useState<DbUroos[]>([]);
  const [allotments, setAllotments] = useState<PageAllotment[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const listMaqams = useServerFn(listMaqamsPublicFn);
  const listUroos = useServerFn(listUroosPublicFn);
  const listAllotments = useServerFn(listAllotmentsFn);
  const listRequests = useServerFn(listRequestsFn);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const [m, u, a, r] = await Promise.all([
          listMaqams(),
          listUroos(),
          listAllotments(),
          listRequests({ data: { status: "pending" } }).catch(() => []),
        ]);
        if (!mounted) return;
        setMaqams((m as DbMaqam[]) || []);
        setUroosList((u as DbUroos[]) || []);
        setAllotments((a as PageAllotment[]) || []);
        setPendingRequestsCount(Array.isArray(r) ? r.length : 0);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const connectedUroosCount = uroosList.filter((x) => !x.isStandalone && x.maqamId).length;
  const standaloneUroosCount = uroosList.filter((x) => x.isStandalone || !x.maqamId).length;

  return (
    <SiteLayout>
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background border-b border-border py-12 md:py-16">
        <div className="pattern-geometric absolute inset-0 opacity-25 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Management Console
                </span>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-xs">
                  Active
                </Badge>
              </div>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Ziyarath Admin & Management Hub
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Super Admin governance, public page allotment system, request approvals, and Maqam / Uroos content editor.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-sm">
                <Link to="/maqam" target="_blank">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Public Maqams
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-sm">
                <Link to="/uroos" target="_blank">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Public Uroos
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="bg-card/70 backdrop-blur border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pending Requests</span>
                <Inbox className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">
                {loading ? "..." : pendingRequestsCount}
              </div>
              <span className="text-[11px] text-muted-foreground">Submissions awaiting review</span>
            </Card>

            <Card className="bg-card/70 backdrop-blur border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Maqams</span>
                <Landmark className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">
                {loading ? "..." : maqams.length}
              </div>
              <span className="text-[11px] text-muted-foreground">Historical shrines & dargahs</span>
            </Card>

            <Card className="bg-card/70 backdrop-blur border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Uroos</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">
                {loading ? "..." : uroosList.length}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {connectedUroosCount} connected • {standaloneUroosCount} standalone
              </span>
            </Card>

            <Card className="bg-card/70 backdrop-blur border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Page Allotments</span>
                <UserCheck className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">
                {loading ? "..." : allotments.length}
              </div>
              <span className="text-[11px] text-muted-foreground">Pages managed by Admins</span>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Admin Modules */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-8">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Administrative Modules
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select an administrative section below to review submissions, allot pages, or edit content.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Requests & Page Approval */}
          <Card className="group flex flex-col justify-between border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Inbox className="h-5 w-5" />
                </div>
                {pendingRequestsCount > 0 && (
                  <Badge className="bg-amber-600 text-white text-xs">
                    {pendingRequestsCount} Pending
                  </Badge>
                )}
              </div>
              <div>
                <CardTitle className="font-display text-lg font-bold group-hover:text-primary transition-colors">
                  Requests & Approvals
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-relaxed">
                  Review incoming community proposals for Maqams and Uroos festivals. Approve requests to instantly create connected or standalone pages.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Approve & generate live pages
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Link Uroos to parent Maqam
                </div>
              </div>

              <Button asChild className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Link to="/admin/requests">
                  Open Requests Inbox
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Super Admin Page Allotments */}
          <Card className="group flex flex-col justify-between border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/5 text-xs">
                  Super Admin
                </Badge>
              </div>
              <div>
                <CardTitle className="font-display text-lg font-bold group-hover:text-primary transition-colors">
                  Page Allotments
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-relaxed">
                  Allot specific Maqam and Uroos pages to designated administrators. Revoke or reassign page management ownership anytime.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Super Admin role authority
                </div>
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Direct email & admin assignment
                </div>
              </div>

              <Button asChild className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Link to="/admin/allotments">
                  Manage Allotments
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Admin Page Management */}
          <Card className="group flex flex-col justify-between border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Edit className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-xs">
                  Admin & Super Admin
                </Badge>
              </div>
              <div>
                <CardTitle className="font-display text-lg font-bold group-hover:text-primary transition-colors">
                  Manage Allotted Pages
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-relaxed">
                  Edit and maintain pages assigned to you. Update visiting hours, festival dates, history, offerings, and contact details.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Scoped page permissions
                </div>
                <div className="flex items-center gap-1.5">
                  <Edit className="h-3.5 w-3.5 text-primary" />
                  Inline modal content editor
                </div>
              </div>

              <Button asChild className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
                <Link to="/admin/pages">
                  Open Page Editor
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informative Guidance Banner */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-emerald-950/20 to-primary/5 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                How the Allotment & Creation Flow Works
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                When a community member submits a Maqam or Uroos proposal, it arrives in the <strong>Requests Inbox</strong>. Approving it creates a published page (either linked to a host Maqam or standalone) and lets you allot it immediately to an admin for long-term maintenance.
              </p>
            </div>
            <div className="shrink-0">
              <Button asChild variant="outline" className="bg-background/80 hover:bg-background border-border">
                <Link to="/admin/requests">
                  View Pending Requests ({pendingRequestsCount})
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

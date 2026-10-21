import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { REGION_LABELS, type MaqamRegion } from "@/data/maqams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Share2,
  Sparkles,
  Plane,
  Train,
  Bus,
  Phone,
  Building2,
  CheckCircle2,
  Compass,
  Heart,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { getUroosPublicDetailFn } from "@/lib/content.functions";
import type { DbUroos, DbMaqam } from "@/types/content";
import { getSubdomainForUroos, ROOT_DOMAIN, getMaqamUrl } from "@/lib/subdomain-config";

export const Route = createFileRoute("/uroos_/$id")({
  beforeLoad: ({ params }) => {
    const subdomain = getSubdomainForUroos(params.id);
    if (subdomain && typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      if (currentHost !== `${subdomain}.${ROOT_DOMAIN}`) {
        window.location.href = `https://${subdomain}.${ROOT_DOMAIN}/uroos`;
      }
    }
  },
  loader: async ({ params }) => {
    const { uroos, connectedMaqam } = await getUroosPublicDetailFn({ data: { id: params.id } });
    if (!uroos) {
      throw notFound();
    }
    return { uroos, connectedMaqam };
  },
  head: ({ loaderData, params }) => {
    const u = loaderData?.uroos;
    if (!u) {
      return { meta: [{ title: "Uroos Not Found — Ziyarath" }] };
    }
    const title = `${u.title} ${u.malayalamTitle ? `(${u.malayalamTitle})` : ""} — Ziyarath`;
    const description = u.description.slice(0, 155);
    const SITE = "https://ziyarath.com";
    const subdomain = getSubdomainForUroos(params.id);
    const canonicalUrl = subdomain
      ? `https://${subdomain}.${ROOT_DOMAIN}/uroos`
      : `${SITE}/uroos/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: u.coverImage || "/assets/og-image.jpg" },
        { property: "og:type", content: "event" },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: UroosDetailPage,
});

function UroosDetailPage() {
  const { uroos, connectedMaqam } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: uroos.title,
          text: `${uroos.title} — ${uroos.hijriMonthName}, Day ${uroos.hijriDay}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <SiteLayout>
      <article className="min-h-screen pb-20">
        {/* Top Breadcrumbs */}
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/uroos">ഉറൂസ് കലണ്ടർ</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/uroos" search={{ region: (uroos.region as any) || "kerala" } as any}>
                    {REGION_LABELS[(uroos.region as MaqamRegion) || "kerala"] || "Kerala"}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 max-w-[200px] sm:max-w-none">
                  {uroos.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Section */}
        <section className="relative mt-4 overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
              {/* Cover Image with gradient overlay */}
              <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-muted">
                {uroos.coverImage ? (
                  <img
                    src={uroos.coverImage}
                    alt={uroos.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900/60 to-background text-emerald-300">
                    <Sparkles className="h-16 w-16 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur font-medium">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      {uroos.hijriMonthName} • Day {uroos.hijriDay}
                    </Badge>
                    {uroos.isStandalone ? (
                      <Badge className="bg-amber-600/90 hover:bg-amber-600 text-white backdrop-blur">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Standalone Festival
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white backdrop-blur">
                        <Building2 className="mr-1 h-3 w-3" />
                        Connected to Maqam
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-background/80 backdrop-blur shadow-sm hover:bg-background"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-1.5 h-4 w-4" />
                    {copied ? "Copied!" : "Share"}
                  </Button>
                </div>

                {/* Bottom Hero Info */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                  {uroos.malayalamTitle && (
                    <p className="text-xl sm:text-2xl font-semibold text-emerald-400 font-sans tracking-wide">
                      {uroos.malayalamTitle}
                    </p>
                  )}
                  <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    {uroos.title}
                  </h1>
                  {uroos.restingPerson && (
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                      In commemoration of: <span className="font-semibold text-foreground">{uroos.restingPerson}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 border-t border-border bg-card/50 sm:grid-cols-4 text-sm">
                <div className="p-4 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                      Location
                    </span>
                    <span className="font-medium text-foreground">
                      {uroos.city}, {uroos.state || "Kerala"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                      Hijri Date
                    </span>
                    <span className="font-medium text-foreground">
                      Day {uroos.hijriDay}, {uroos.hijriMonthName}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                      Schedule
                    </span>
                    <span className="font-medium text-foreground">
                      {uroos.gregorianDate || "Annual"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-3">
                  <Compass className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                      Recurrence
                    </span>
                    <span className="font-medium text-foreground">
                      {uroos.recurrence || "Annual Gathering"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left / Center 2 Columns: Main Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Interactive Dual Navigation: Link to Hijri Calendar & Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Link to Hijri Calendar */}
              <Card className="border-primary/20 bg-primary/5 hover:border-primary/40 transition-all shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                        Hijri Calendar
                      </span>
                      <p className="font-bold text-foreground text-sm leading-tight">
                        {uroos.hijriMonthName} • Day {uroos.hijriDay}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground h-8 gap-1">
                    <Link to="/uroos" search={{ month: uroos.hijriMonth, day: uroos.hijriDay, view: "grid" } as any}>
                      Calendar
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Link to Region */}
              <Card className="border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                        Region & Location
                      </span>
                      <p className="font-bold text-foreground text-sm leading-tight">
                        {uroos.region === "middle-east"
                          ? `Middle East (${uroos.country})`
                          : uroos.region === "worldwide"
                          ? `Worldwide (${uroos.country})`
                          : uroos.region === "india"
                          ? `India (${uroos.state || uroos.city})`
                          : `Kerala (${uroos.city})`}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-600 hover:text-white h-8 gap-1">
                    <Link to="/uroos" search={{ region: uroos.region || "kerala" } as any}>
                      Region
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            {/* Connected Maqam Banner (if connected) */}
            {connectedMaqam && (
              <Card className="overflow-hidden border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                        <Landmark className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                            Hosted At Sacred Maqam
                          </span>
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600">
                            Verified Precinct
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mt-0.5">
                          {connectedMaqam.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {connectedMaqam.location}, {connectedMaqam.city} • {connectedMaqam.country}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Link to="/maqam/$id" params={{ id: connectedMaqam.id }}>
                        Explore Maqam Details
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Standalone Banner (if standalone) */}
            {uroos.isStandalone && (
              <Card className="overflow-hidden border-amber-500/30 bg-amber-500/5 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-3.5">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                          Standalone Spiritual Celebration
                        </span>
                        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                          Independent Venue
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        {uroos.venueName || `${uroos.title} Venue`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Celebrated as a community spiritual event in {uroos.city}, {uroos.state || "Kerala"}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overview / Description */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  About the Uroos
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {uroos.description}
                </p>

                {uroos.significance && (
                  <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-primary">
                      Spiritual & Cultural Significance
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">
                      {uroos.significance}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historical Background */}
            {uroos.history && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    Historical Background
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                    {uroos.history}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Program Schedule & Itinerary */}
            {uroos.programSchedule && uroos.programSchedule.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Program Schedule & Majlis
                  </h2>
                  <div className="mt-4 space-y-3">
                    {uroos.programSchedule.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-border/60 bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs font-semibold shrink-0">
                            {p.time}
                          </Badge>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{p.event}</p>
                            {p.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                            )}
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 hidden sm:block" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nercha Offerings & Traditions */}
            {uroos.nerchaOfferings && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Nercha Offerings & Annadanam
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {uroos.nerchaOfferings}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Travel Guide & How to Reach */}
            {uroos.howToReach && uroos.howToReach.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    How to Reach
                  </h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {uroos.howToReach.map((h: any, idx: number) => {
                      const modeLower = h.mode.toLowerCase();
                      const Icon = modeLower.includes("air")
                        ? Plane
                        : modeLower.includes("train")
                        ? Train
                        : Bus;
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card">
                          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                            <Icon className="h-4 w-4" />
                            {h.mode}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            {h.details}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Organizer, Venue, and Action Card */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="border-border sticky top-20 shadow-sm">
              <CardContent className="p-5 space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Festival Summary
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-1">
                    {uroos.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {uroos.city}, {uroos.state || "Kerala"}
                  </p>
                </div>

                <Separator />

                {/* Organizer Contact */}
                {uroos.organizerName && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Organizing Committee
                    </span>
                    <p className="font-medium text-foreground text-sm mt-1">
                      {uroos.organizerName}
                    </p>
                    {uroos.organizerContact && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        {uroos.organizerContact}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2.5 pt-2">
                  {connectedMaqam && (
                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Link to="/maqam/$id" params={{ id: connectedMaqam.id }}>
                        <Landmark className="mr-2 h-4 w-4" />
                        View Connected Maqam
                      </Link>
                    </Button>
                  )}

                  <Button asChild variant="outline" className="w-full justify-between h-9 text-xs">
                    <Link to="/uroos" search={{ month: uroos.hijriMonth, day: uroos.hijriDay, view: "grid" } as any}>
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Month {uroos.hijriMonth} Calendar
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-between h-9 text-xs">
                    <Link to="/uroos" search={{ region: (uroos.region as any) || "kerala" } as any}>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        {uroos.region === "middle-east"
                          ? "All Middle East Uroos"
                          : uroos.region === "worldwide"
                          ? "All Worldwide Uroos"
                          : uroos.region === "india"
                          ? "All India Uroos"
                          : "All Kerala Uroos"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Uroos Information
                  </Button>

                  <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                    <Link to="/uroos">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to All Uroos
                    </Link>
                  </Button>
                </div>

                {uroos.sourceUrl && (
                  <div className="pt-2 text-center">
                    <a
                      href={uroos.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      Official Reference / Source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </article>
    </SiteLayout>
  );
}

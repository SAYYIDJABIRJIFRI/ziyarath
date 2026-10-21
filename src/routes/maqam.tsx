import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, Suspense } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  MAQAMS,
  REGION_LABELS,
  CATEGORY_LABELS,
  type Maqam,
  type MaqamRegion,
  type MaqamCategory,
} from "@/data/maqams";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestDialog } from "@/components/site/RequestDialog";
import { Plus } from "lucide-react";
import { getMaqamUrl, isSubdomainMaqam } from "@/lib/subdomain-config";



const REGIONS: MaqamRegion[] = ["kerala", "india", "middle-east", "worldwide"];
const CATEGORIES: MaqamCategory[] = [
  "sufi",
  "scholar",
  "sahaba",
  "shaheed",
  "prophet",
];

const regionEnum = z.enum(["all", "kerala", "india", "middle-east", "worldwide"]);
const categoryEnum = z.enum([
  "all",
  "sufi",
  "scholar",
  "sahaba",
  "shaheed",
  "prophet",
]);

const PAGE_SIZE = 6;

const maqamSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  region: fallback(regionEnum, "all").default("all"),
  category: fallback(categoryEnum, "all").default("all"),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/maqam")({
  validateSearch: zodValidator(maqamSearchSchema),
  head: () => ({
    meta: [
      { title: "Maqam Directory — Ziyarath" },
      {
        name: "description",
        content:
          "A directory of revered maqams and dargahs across Kerala, India, and the wider Muslim world. Filter by region and category to plan your ziyarath.",
      },
      { property: "og:title", content: "Maqam Directory — Ziyarath" },
      {
        property: "og:description",
        content:
          "Explore maqams and dargahs by region and category — Kerala, India, Middle East and beyond.",
      },
      { property: "og:url", content: "/maqam" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/maqam" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Maqam Directory",
          itemListElement: MAQAMS.map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: m.name,
            description: m.description,
          })),
        }),
      },
    ],
  }),
  loader: async () => {
    const { listMaqamsPublicFn } = await import("@/lib/content.functions");
    const dynamicMaqams = await listMaqamsPublicFn();
    return { dynamicMaqams };
  },
  component: MaqamPage,
});

function MaqamPage() {
  const { dynamicMaqams = MAQAMS } = Route.useLoaderData();
  const { q: query, region, category, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/maqam" });

  type MaqamSearch = z.infer<typeof maqamSearchSchema>;
  const setQuery = (v: string) =>
    navigate({ search: (prev: MaqamSearch) => ({ ...prev, q: v, page: 1 }), replace: true });
  const setRegion = (v: MaqamRegion | "all") =>
    navigate({ search: (prev: MaqamSearch) => ({ ...prev, region: v, page: 1 }), replace: true });
  const setCategory = (v: MaqamCategory | "all") =>
    navigate({ search: (prev: MaqamSearch) => ({ ...prev, category: v, page: 1 }), replace: true });
  const clearAll = () =>
    navigate({ search: { q: "", region: "all", category: "all", page: 1 }, replace: true });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dynamicMaqams.filter((m) => {
      if (region !== "all" && m.region !== region) return false;
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      return [
        m.name,
        m.malayalamName,
        m.location,
        m.city,
        m.country,
        m.description,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [query, region, category]);

  const counts = useMemo(() => {
    const r: Record<string, number> = { all: MAQAMS.length };
    for (const m of MAQAMS) r[m.region] = (r[m.region] ?? 0) + 1;
    return r;
  }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  const hasFilters = region !== "all" || category !== "all" || query.length > 0;

  // Suggestions for empty state: relax one filter at a time
  const suggestions = useMemo(() => {
    if (filtered.length > 0) return null;
    const q = query.trim().toLowerCase();
    const matchesQuery = (m: Maqam) =>
      !q ||
      [m.name, m.malayalamName, m.location, m.city, m.country, m.description]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));

    const withoutRegion =
      region === "all"
        ? []
        : MAQAMS.filter(
          (m) =>
            matchesQuery(m) && (category === "all" || m.category === category),
        );
    const withoutCategory =
      category === "all"
        ? []
        : MAQAMS.filter(
          (m) => matchesQuery(m) && (region === "all" || m.region === region),
        );
    const withoutQuery =
      q.length === 0
        ? []
        : MAQAMS.filter(
          (m) =>
            (region === "all" || m.region === region) &&
            (category === "all" || m.category === category),
        );

    return {
      withoutRegion: withoutRegion.length,
      withoutCategory: withoutCategory.length,
      withoutQuery: withoutQuery.length,
      popular: MAQAMS.slice(0, 4),
    };
  }, [filtered.length, query, region, category]);



  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Ziyarath Directory</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Maqam &amp; Dargah Directory
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Discover sacred resting places of the awliya, scholars and companions —
            from Malabar to Madina. Filter by region or category to plan your next
            ziyarath.
          </p>

          <div className="mt-5">
            <RequestDialog
              type="maqam"
              title="Request a Maqam / Dargah"
              description="Know a sacred site missing from our directory? Share the details and we'll consider adding it."
              subjectPlaceholder="e.g. Mampuram Maqam, Kerala"
              detailsPlaceholder="Location, history, visiting hours, source references, contact of caretaker (if any)…"
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Request a maqam
                </Button>
              }
            />
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city or country…"
                className="h-11 pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip active={region === "all"} onClick={() => setRegion("all")}>
                All regions
                <span className="ml-1 text-xs opacity-70">{counts.all}</span>
              </Chip>
              {REGIONS.map((r) => (
                <Chip
                  key={r}
                  active={region === r}
                  onClick={() => setRegion(r)}
                >
                  {REGION_LABELS[r]}
                  {counts[r] ? (
                    <span className="ml-1 text-xs opacity-70">{counts[r]}</span>
                  ) : null}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip
                small
                active={category === "all"}
                onClick={() => setCategory("all")}
              >
                All types
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  small
                  active={category === c}
                  onClick={() => setCategory(c)}
                >
                  {CATEGORY_LABELS[c]}
                </Chip>
              ))}
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 text-sm text-muted-foreground">
          {filtered.length > PAGE_SIZE
            ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} maqams`
            : `Showing ${filtered.length} of ${MAQAMS.length} maqams`}
        </div>

        {filtered.length === 0 ? (
          <Card className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-3">
                <Compass className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">
                No maqams match your filters
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {query
                  ? <>We couldn't find anything for &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo; with the current filters.</>
                  : "Try relaxing a filter or exploring a different region."}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestions && suggestions.withoutQuery > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setQuery("")}>
                    Clear search ({suggestions.withoutQuery})
                  </Button>
                )}
                {suggestions && suggestions.withoutRegion > 0 && region !== "all" && (
                  <Button size="sm" variant="outline" onClick={() => setRegion("all")}>
                    All regions ({suggestions.withoutRegion})
                  </Button>
                )}
                {suggestions && suggestions.withoutCategory > 0 && category !== "all" && (
                  <Button size="sm" variant="outline" onClick={() => setCategory("all")}>
                    All types ({suggestions.withoutCategory})
                  </Button>
                )}
                <Button size="sm" onClick={clearAll}>
                  Reset filters
                </Button>
              </div>

              {suggestions && (
                <div className="mt-8 w-full border-t border-border pt-6">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Popular maqams
                  </div>
                  <div className="grid gap-2 text-left sm:grid-cols-2">
                    {suggestions.popular.map((m) => {
                      const url = getMaqamUrl(m.id);
                      const isExternal = url.startsWith("http");
                      const Wrapper = isExternal ? "a" : Link;
                      const wrapperProps = isExternal
                        ? { href: url }
                        : { to: "/maqam/$id" as const, params: { id: m.id } };
                      return (
                      <Wrapper
                        key={m.id}
                        {...(wrapperProps as any)}
                        className="group flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate font-medium group-hover:underline">
                            {m.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {m.city}, {m.country}
                          </div>
                        </div>
                      </Wrapper>
                    );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((m) => (
                <MaqamCard key={m.id} maqam={m} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Maqam pagination"
                className="mt-12 flex items-center justify-center gap-2"
              >
                <Link
                  to="/maqam"
                  search={{ q: query, region, category, page: Math.max(1, currentPage - 1) }}
                  aria-label="Previous page"
                  aria-disabled={currentPage === 1}
                  className={`inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground ${currentPage === 1 ? "pointer-events-none opacity-40" : ""
                    }`}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Link>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  const active = n === currentPage;
                  return (
                    <Link
                      key={n}
                      to="/maqam"
                      search={{ q: query, region, category, page: n }}
                      aria-current={active ? "page" : undefined}
                      className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold transition-colors ${active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-primary/10 hover:text-primary"
                        }`}
                    >
                      {n}
                    </Link>
                  );
                })}

                <Link
                  to="/maqam"
                  search={{ q: query, region, category, page: Math.min(totalPages, currentPage + 1) }}
                  aria-label="Next page"
                  aria-disabled={currentPage === totalPages}
                  className={`inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground ${currentPage === totalPages ? "pointer-events-none opacity-40" : ""
                    }`}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              </nav>
            )}
          </>
        )}
      </section>



    </SiteLayout>
  );
}

function Chip({
  active,
  small,
  onClick,
  children,
}: {
  active?: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border transition-colors",
        small ? "min-h-8 px-3 text-xs" : "min-h-9 px-4 text-sm",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function MaqamCard({ maqam: m }: { maqam: Maqam }) {
  const url = getMaqamUrl(m.id);
  const isExternal = url.startsWith("http");

  const cardContent = (
    <Card className="flex h-full flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-snug group-hover:underline">
            {m.name}
          </h3>
          {m.malayalamName && (
            <p className="mt-1 text-sm text-muted-foreground">
              {m.malayalamName}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {CATEGORY_LABELS[m.category]}
        </Badge>
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="break-words">
          {m.city}, {m.country}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-foreground/80">
        {m.description}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">{REGION_LABELS[m.region]}</Badge>
          {m.era && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {m.era}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
          <span>Explore</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Card>
  );

  if (isExternal) {
    return (
      <a href={url} className="group text-left">
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      to="/maqam/$id"
      params={{ id: m.id }}
      className="group text-left"
    >
      {cardContent}
    </Link>
  );
}

function MaqamSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-5 w-16 shrink-0" />
          </div>
          <Skeleton className="mt-4 h-4 w-4/5" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-auto pt-5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-4 h-4 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

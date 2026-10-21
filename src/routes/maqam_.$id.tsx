import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  MAQAMS,
  REGION_LABELS,
  CATEGORY_LABELS,
  type Maqam,
} from "@/data/maqams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Building2,
  Bus,
  Clock,
  Contact,
  ExternalLink,
  Flower2,
  Heart,
  History,
  Landmark,
  MapPin,
  Navigation,
  Palette,
  Phone,
  Plane,
  Sparkles,
  Train,
  Wifi,
} from "lucide-react";

import { getMaqamPublicDetailFn } from "@/lib/content.functions";
import type { DbUroos } from "@/types/content";
import { getSubdomainForMaqam, ROOT_DOMAIN, getUroosUrl } from "@/lib/subdomain-config";

export const Route = createFileRoute("/maqam_/$id")({
  loader: async ({ params }) => {
    const { maqam, connectedUroos } = await getMaqamPublicDetailFn({ data: { id: params.id } });
    if (!maqam) throw notFound();
    return { maqam, connectedUroos };
  },
  head: ({ loaderData, params }) => {
    const m = loaderData?.maqam;
    if (!m) {
      return {
        meta: [{ title: "Maqam not found — Ziyarath" }],
      };
    }
    const SITE = "https://ziyarath.com";
    const subdomain = getSubdomainForMaqam(params.id);
    const title = `${m.name} — Ziyarath`;
    const description = m.description.slice(0, 155);
    const url = subdomain
      ? `https://${subdomain}.${ROOT_DOMAIN}/maqam`
      : `${SITE}/maqam/${params.id}`;

    // Build FAQ entries from structured content where relevant.
    const faqEntries: { question: string; answer: string }[] = [];
    if (m.visitingHours && m.visitingHours.length > 0) {
      faqEntries.push({
        question: `What are the visiting hours of ${m.name}?`,
        answer: m.visitingHours
          .map((v: any) => `${v.label}: ${v.hours}`)
          .join(". "),
      });
    }
    if (m.howToReach && m.howToReach.length > 0) {
      faqEntries.push({
        question: `How do I reach ${m.name}?`,
        answer: m.howToReach
          .map((h: any) => `${h.mode} — ${h.details}`)
          .join(" "),
      });
    }
    if (m.nerchaa && m.nerchaa.length > 0) {
      faqEntries.push({
        question: `What nercha and offerings are held at ${m.name}?`,
        answer: m.nerchaa
          .map((n: any) => `${n.title}${n.month ? ` (${n.month})` : ""}: ${n.description}`)
          .join(" "),
      });
    }
    if (m.bestTimeToVisit) {
      faqEntries.push({
        question: `When is the best time to visit ${m.name}?`,
        answer: `The best time to visit is ${m.bestTimeToVisit}.`,
      });
    }
    if (m.facilities && m.facilities.length > 0) {
      faqEntries.push({
        question: `What facilities are available at ${m.name}?`,
        answer: `Available facilities include ${m.facilities.join(", ")}.`,
      });
    }

    const placeLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": ["Place", "TouristAttraction", "LandmarksOrHistoricalBuildings"],
      "@id": url,
      name: m.name,
      alternateName: m.malayalamName,
      description: m.description,
      url,
      address: {
        "@type": "PostalAddress",
        addressLocality: m.city,
        addressCountry: m.country,
        ...(m.addressDetail ? { streetAddress: m.addressDetail } : {}),
      },
      isAccessibleForFree: true,
      publicAccess: true,
      touristType: "Religious and heritage pilgrims",
    };
    if (m.coverImage) placeLd.image = `${SITE}${m.coverImage}`;
    if (m.contactInfo?.phone) placeLd.telephone = m.contactInfo.phone;
    if (m.contactInfo?.email) placeLd.email = m.contactInfo.email;
    const sameAs = [
      m.sourceUrl,
      m.contactInfo?.website,
    ].filter(Boolean) as string[];
    if (sameAs.length) placeLd.sameAs = sameAs;
    if (m.visitingHours && m.visitingHours.length > 0) {
      placeLd.openingHours = m.visitingHours.map(
        (v: any) => `${v.label}: ${v.hours}`,
      );
    }

    const scripts: {
      type: string;
      children: string;
    }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify(placeLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: "Maqam Directory",
              item: `${SITE}/maqam`,
            },
            { "@type": "ListItem", position: 3, name: m.name, item: url },
          ],
        }),
      },
    ];

    if (faqEntries.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          })),
        }),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(m.coverImage
          ? [{ property: "og:image", content: `${SITE}${m.coverImage}` }]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">Maqam not found</h1>
        <p className="mt-3 text-muted-foreground">
          We could not find that maqam in our directory.
        </p>
        <Link to="/maqam" className="mt-6 inline-block">
          <Button>Back to directory</Button>
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ reset }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </SiteLayout>
  ),
  component: MaqamDetailPage,
});

function MaqamDetailPage() {
  const { maqam: m, connectedUroos } = Route.useLoaderData() as {
    maqam: Maqam;
    connectedUroos: DbUroos[];
  };
  const related: Maqam[] = MAQAMS.filter(
    (x) => x.id !== m.id && (x.region === m.region || x.category === m.category),
  ).slice(0, 3);

  const mapQuery = encodeURIComponent(
    `${m.name} ${m.city} ${m.country}`,
  );

  return (
    <SiteLayout>
      {/* Hero image area */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 to-background">
        <div className="pattern-geometric absolute inset-0 opacity-40" />
        {m.coverImage && (
          <div className="relative mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-xl shadow-elegant">
              <img
                src={m.coverImage}
                alt={`${m.name} cover`}
                className="h-48 w-full object-cover sm:h-64 lg:h-80"
                width={1280}
                height={640}
              />
            </div>
          </div>
        )}
        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/maqam">Maqam</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{m.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABELS[m.category]}</Badge>
            <Badge variant="outline">{REGION_LABELS[m.region]}</Badge>
            {m.era && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {m.era}
              </Badge>
            )}
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {m.name}
          </h1>
          {m.malayalamName && (
            <p className="mt-2 text-lg text-muted-foreground sm:text-xl">
              {m.malayalamName}
            </p>
          )}
        </div>
      </div>

      <article className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Quick info cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Location
                </div>
                <div className="mt-1 text-sm font-medium">{m.city}</div>
                <div className="text-xs text-muted-foreground">{m.country}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Best Time
                </div>
                <div className="mt-1 text-sm font-medium">
                  {m.bestTimeToVisit || "Year round"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </div>
                <div className="mt-1 text-sm font-medium">
                  {CATEGORY_LABELS[m.category]}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <History className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Era
                </div>
                <div className="mt-1 text-sm font-medium">{m.era || "Ancient"}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
              {m.description}
            </p>

            {m.significance && (
              <Card className="mt-6 border-l-4 border-l-primary p-5">
                <div className="flex items-start gap-3">
                  <Heart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Significance
                    </div>
                    <p className="mt-2 leading-relaxed text-foreground/90">
                      {m.significance}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {m.history && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
                  <History className="h-5 w-5 text-primary" />
                  History
                </h2>
                <p className="mt-3 leading-relaxed text-foreground/85">
                  {m.history}
                </p>
              </section>
            )}

            {m.architecture && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
                  <Palette className="h-5 w-5 text-primary" />
                  Architecture
                </h2>
                <p className="mt-3 leading-relaxed text-foreground/85">
                  {m.architecture}
                </p>
              </section>
            )}

            {/* Visiting Hours */}
            {m.visitingHours && m.visitingHours.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
                  <Clock className="h-5 w-5 text-primary" />
                  Timings
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {m.visitingHours.map((vh, i) => (
                    <Card key={i} className="p-4">
                      <div className="text-sm font-semibold">{vh.label}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {vh.hours}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Connected Uroos Celebrations */}
            {connectedUroos && connectedUroos.length > 0 && (
              <section className="mt-10">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl text-foreground">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    Annual Uroos & Nercha Celebrations
                  </h2>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                    {connectedUroos.length} Connected {connectedUroos.length === 1 ? "Event" : "Events"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Official annual Uroos gatherings and memorial commemorations held at this sacred maqam.
                </p>

                <div className="mt-4 grid gap-4">
                  {connectedUroos.map((u) => (
                    <Card key={u.id} className="overflow-hidden border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-card hover:border-emerald-500/40 transition-all p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-medium text-xs">
                              {u.hijriMonthName} • Day {u.hijriDay}
                            </Badge>
                            {u.gregorianDate && (
                              <Badge variant="secondary" className="text-xs">
                                {u.gregorianDate}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-foreground">
                            {u.title}
                          </h3>
                          {u.malayalamTitle && (
                            <p className="text-xs text-emerald-600 font-semibold">
                              {u.malayalamTitle}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {u.description}
                          </p>
                        </div>
                        <Button asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        {(() => {\r
                          const uUrl = getUroosUrl(u.id);\r
                          const isSdUroos = uUrl.startsWith("http");\r
                          return isSdUroos ? (\r
                            <a href={uUrl}>\r
                              View Uroos Page\r
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />\r
                            </a>\r
                          ) : (\r
                            <Link to="/uroos/$id" params={{ id: u.id }}>\r
                              View Uroos Page\r
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />\r
                            </Link>\r
                          );\r
                        })()}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Nerchaa */}
            {m.nerchaa && m.nerchaa.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
                  <Flower2 className="h-5 w-5 text-primary" />
                  Nercha & Offerings
                </h2>
                <div className="mt-4 space-y-4">
                  {m.nerchaa.map((n, i) => (
                    <Card key={i} className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold">
                          {n.title}
                        </span>
                        {n.month && (
                          <Badge variant="secondary" className="text-xs">
                            {n.month}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                        {n.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* How to Reach */}
            {m.howToReach && m.howToReach.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
                  <Navigation className="h-5 w-5 text-primary" />
                  How to Reach
                </h2>
                <div className="mt-4 space-y-3">
                  {m.howToReach.map((htr, i) => {
                    const modeIcon =
                      htr.mode.toLowerCase().includes("air") ? (
                        <Plane className="h-4 w-4" />
                      ) : htr.mode.toLowerCase().includes("train") ? (
                        <Train className="h-4 w-4" />
                      ) : htr.mode.toLowerCase().includes("metro") ? (
                        <Train className="h-4 w-4" />
                      ) : (
                        <Bus className="h-4 w-4" />
                      );
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4"
                      >
                        <div className="mt-0.5 shrink-0 text-primary">
                          {modeIcon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{htr.mode}</div>
                          <div className="mt-0.5 text-sm text-muted-foreground">
                            {htr.details}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Facilities */}
            {m.facilities && m.facilities.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
                  <Landmark className="h-5 w-5 text-primary" />
                  Facilities
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.facilities.map((f, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1.5 text-sm">
                      {f}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Location card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-emerald-deep/10 p-4">
                <h3 className="flex items-center gap-2 font-display font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </h3>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{m.location}</div>
                    {m.addressDetail && (
                      <div className="mt-0.5 text-muted-foreground">
                        {m.addressDetail}
                      </div>
                    )}
                    <div className="mt-1 text-muted-foreground">
                      {m.city}, {m.country}
                    </div>
                  </div>
                </div>
                <a
                  className="flex items-center gap-2 text-primary hover:underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-4 w-4" />
                  Open in Google Maps
                </a>
              </div>
            </Card>

            {/* Contact card */}
            {(m.contactInfo?.phone || m.contactInfo?.email || m.contactInfo?.website) && (
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-emerald-deep/10 p-4">
                  <h3 className="flex items-center gap-2 font-display font-semibold">
                    <Contact className="h-4 w-4 text-primary" />
                    Contact
                  </h3>
                </div>
                <div className="space-y-3 p-4 text-sm">
                  {m.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{m.contactInfo.phone}</span>
                    </div>
                  )}
                  {m.contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <a
                        href={`mailto:${m.contactInfo.email}`}
                        className="text-primary hover:underline"
                      >
                        {m.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {m.contactInfo.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <a
                        href={m.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {m.contactInfo.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Quick FAQ accordion */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-emerald-deep/10 p-4">
                <h3 className="font-display font-semibold">Quick Info</h3>
              </div>
              <Accordion type="single" collapsible className="w-full px-4">
                <AccordionItem value="dress">
                  <AccordionTrigger className="text-sm">
                    Dress code
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Modest Islamic attire recommended. Men should cover shoulders
                    and knees. Women should wear a headscarf and loose clothing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="etiquette">
                  <AccordionTrigger className="text-sm">
                    Visiting etiquette
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Remove footwear before entering sacred areas. Maintain silence
                    near the tomb. Photography may be restricted — ask locally.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="offerings">
                  <AccordionTrigger className="text-sm">
                    What to offer
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Flowers, chadars (sacred cloth), incense, and sweets are
                    common offerings. Cash donations support shrine upkeep.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </aside>
        </div>

        <Separator className="my-10" />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Link to="/maqam">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to directory
            </Button>
          </Link>
          {m.sourceUrl && (
            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" /> Source
              </Button>
            </a>
          )}
        </div>

        {/* Related maqams */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold">Related maqams</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/maqam/$id"
                  params={{ id: r.id }}
                  className="block"
                >
                  <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-display font-semibold">{r.name}</div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {CATEGORY_LABELS[r.category]}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.city}, {r.country}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
}

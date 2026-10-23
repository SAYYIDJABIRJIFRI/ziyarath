import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { MaqamDetailContent } from "@/components/site/MaqamDetailContent";
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
  beforeLoad: ({ params }) => {
    const subdomain = getSubdomainForMaqam(params.id);
    if (subdomain && typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      const isLocal = currentHost === "localhost" || currentHost === "127.0.0.1" || currentHost.endsWith(".localhost");
      if (!isLocal && currentHost !== `${subdomain}.${ROOT_DOMAIN}`) {
        window.location.href = `https://${subdomain}.${ROOT_DOMAIN}/maqam`;
      }
    }
  },
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

  return <MaqamDetailContent maqam={m} connectedUroos={connectedUroos} isSubdomain={false} />;
}

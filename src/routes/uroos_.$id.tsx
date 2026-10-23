import { createFileRoute, notFound } from "@tanstack/react-router";
import { getUroosPublicDetailFn } from "@/lib/content.functions";
import { getSubdomainForUroos, ROOT_DOMAIN } from "@/lib/subdomain-config";
import { UroosDetailContent } from "@/components/site/UroosDetailContent";

export const Route = createFileRoute("/uroos_/$id")({
  beforeLoad: ({ params }) => {
    const subdomain = getSubdomainForUroos(params.id);
    if (subdomain && typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      const isLocal = currentHost === "localhost" || currentHost === "127.0.0.1" || currentHost.endsWith(".localhost");
      if (!isLocal && currentHost !== `${subdomain}.${ROOT_DOMAIN}`) {
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
  return (
    <UroosDetailContent
      uroos={uroos}
      connectedMaqam={connectedMaqam}
      isSubdomain={false}
    />
  );
}


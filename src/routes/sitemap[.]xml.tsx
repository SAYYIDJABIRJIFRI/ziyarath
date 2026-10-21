import { createFileRoute } from "@tanstack/react-router";
import { POSTS } from "@/data/posts";
import { MAQAMS } from "@/data/maqams";
import { SUBDOMAIN_REGISTRY, ROOT_DOMAIN } from "@/lib/subdomain-config";

const ROUTES = ["/", "/about", "/blog", "/uroos", "/maqam", "/contact", "/privacy"];
const BASE = "https://ziyarath.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const staticUrls = ROUTES.map(
          (r) =>
            `<url><loc>${BASE}${r}</loc><changefreq>weekly</changefreq><priority>${r === "/" ? "1.0" : "0.8"}</priority></url>`,
        ).join("");

        const postUrls = POSTS.map((p) => {
          const lastmod = (p.isoDate ?? "").slice(0, 10);
          return `<url><loc>${BASE}/blog/${p.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
        }).join("");

        // Build maqam URLs — use subdomain for registered maqams, path for others
        const subdomainLookup = new Map(
          Object.entries(SUBDOMAIN_REGISTRY).map(([sub, entry]) => [entry.maqamId, { sub, ...entry }]),
        );

        const maqamUrls = MAQAMS.map((m) => {
          const sdEntry = subdomainLookup.get(m.id);
          if (sdEntry) {
            // Subdomain maqam: canonical is subdomain.ROOT_DOMAIN/maqam
            const subBase = `https://${sdEntry.sub}.${ROOT_DOMAIN}`;
            let urls = `<url><loc>${subBase}/maqam</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
            if (sdEntry.uroosId) {
              urls += `<url><loc>${subBase}/uroos</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
            }
            return urls;
          }
          return `<url><loc>${BASE}/maqam/${m.id}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
        }).join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}${maqamUrls}</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml" },
        });
      },
    },
  },
});

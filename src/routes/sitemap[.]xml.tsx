import { createFileRoute } from "@tanstack/react-router";
import { POSTS } from "@/data/posts";
import { MAQAMS } from "@/data/maqams";

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

        const maqamUrls = MAQAMS.map(
          (m) =>
            `<url><loc>${BASE}/maqam/${m.id}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
        ).join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}${maqamUrls}</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml" },
        });
      },
    },
  },
});

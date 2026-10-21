import { createFileRoute } from "@tanstack/react-router";\r
import { POSTS } from "@/data/posts";\r
import { MAQAMS } from "@/data/maqams";\r
import { SUBDOMAIN_REGISTRY, ROOT_DOMAIN } from "@/lib/subdomain-config";\r
\r
const ROUTES = ["/", "/about", "/blog", "/uroos", "/maqam", "/contact", "/privacy"];\r
const BASE = "https://ziyarath.com";\r
\r
export const Route = createFileRoute("/sitemap.xml")({\r
  server: {\r
    handlers: {\r
      GET: () => {\r
        const staticUrls = ROUTES.map(\r
          (r) =>\r
            `<url><loc>${BASE}${r}</loc><changefreq>weekly</changefreq><priority>${r === "/" ? "1.0" : "0.8"}</priority></url>`,\r
        ).join("");\r
\r
        const postUrls = POSTS.map((p) => {\r
          const lastmod = (p.isoDate ?? "").slice(0, 10);\r
          return `<url><loc>${BASE}/blog/${p.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;\r
        }).join("");\r
\r
        // Build maqam URLs — use subdomain for registered maqams, path for others\r
        const subdomainLookup = new Map(\r
          Object.entries(SUBDOMAIN_REGISTRY).map(([sub, entry]) => [entry.maqamId, { sub, ...entry }]),\r
        );\r
\r
        const maqamUrls = MAQAMS.map((m) => {\r
          const sdEntry = subdomainLookup.get(m.id);\r
          if (sdEntry) {\r
            // Subdomain maqam: canonical is subdomain.ROOT_DOMAIN/maqam\r
            const subBase = `https://${sdEntry.sub}.${ROOT_DOMAIN}`;\r
            let urls = `<url><loc>${subBase}/maqam</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;\r
            if (sdEntry.uroosId) {\r
              urls += `<url><loc>${subBase}/uroos</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;\r
            }\r
            return urls;\r
          }\r
          return `<url><loc>${BASE}/maqam/${m.id}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`;\r
        }).join("");\r
\r
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}${maqamUrls}</urlset>`;\r
        return new Response(xml, {\r
          headers: { "Content-Type": "application/xml" },\r
        });\r
      },\r
    },\r
  },\r
});\r

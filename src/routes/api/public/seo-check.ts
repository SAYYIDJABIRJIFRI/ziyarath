import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://ziyarath.com";
const UA = "ZiyarathSeoCheck/1.0";

type HeaderCheck = { name: string; value: string | null; ok: boolean; expected: string };

type UrlCheck = {
  url: string;
  ok: boolean;
  status: number;
  statusOk: boolean;
  contentType: string | null;
  contentTypeOk: boolean;
  bytes: number;
  xmlValid: boolean | null;
  xmlError?: string;
  headers: HeaderCheck[];
  extras: Record<string, unknown>;
  error?: string;
  durationMs: number;
};

function validateSitemapXml(text: string): { ok: boolean; error?: string; urlCount?: number } {
  const trimmed = text.trim();
  if (!trimmed.startsWith("<?xml")) return { ok: false, error: "Missing XML declaration" };
  if (!/<urlset[\s>]/i.test(trimmed) && !/<sitemapindex[\s>]/i.test(trimmed)) {
    return { ok: false, error: "Missing <urlset> or <sitemapindex> root element" };
  }
  if (!/<\/urlset>|<\/sitemapindex>/i.test(trimmed)) {
    return { ok: false, error: "Root element not closed" };
  }
  // Basic tag-balance check: count opening vs closing <url> / <loc>.
  const opens = (trimmed.match(/<url>/g) ?? []).length;
  const closes = (trimmed.match(/<\/url>/g) ?? []).length;
  if (opens !== closes) return { ok: false, error: `Unbalanced <url> tags: ${opens} open vs ${closes} close` };
  const locs = (trimmed.match(/<loc>/g) ?? []).length;
  if (locs === 0) return { ok: false, error: "No <loc> entries found" };
  return { ok: true, urlCount: opens || locs };
}

async function fetchAndCheck(
  url: string,
  opts: { expectContentType: string; expectXml: boolean; extraChecks?: (body: string) => Record<string, unknown> },
): Promise<UrlCheck> {
  const started = Date.now();
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    const text = await res.text();
    const contentType = res.headers.get("content-type");
    const contentTypeOk = contentType?.toLowerCase().includes(opts.expectContentType) ?? false;
    const xml = opts.expectXml ? validateSitemapXml(text) : { ok: null as null };
    const headers: HeaderCheck[] = [
      { name: "content-type", value: contentType, ok: contentTypeOk, expected: `contains "${opts.expectContentType}"` },
    ];
    const extras = opts.extraChecks ? opts.extraChecks(text) : {};
    const statusOk = res.status === 200;
    return {
      url,
      ok: statusOk && contentTypeOk && (xml.ok !== false),
      status: res.status,
      statusOk,
      contentType,
      contentTypeOk,
      bytes: text.length,
      xmlValid: xml.ok,
      xmlError: "error" in xml ? xml.error : undefined,
      headers,
      extras: { ...extras, ...("urlCount" in xml && xml.urlCount ? { urlCount: xml.urlCount } : {}) },
      durationMs: Date.now() - started,
    };
  } catch (e) {
    return {
      url,
      ok: false,
      status: 0,
      statusOk: false,
      contentType: null,
      contentTypeOk: false,
      bytes: 0,
      xmlValid: null,
      headers: [],
      extras: {},
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - started,
    };
  }
}

export const Route = createFileRoute("/api/public/seo-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = url.searchParams.get("base")?.replace(/\/$/, "") || BASE;

        const [sitemap, robots] = await Promise.all([
          fetchAndCheck(`${base}/sitemap.xml`, { expectContentType: "xml", expectXml: true }),
          fetchAndCheck(`${base}/robots.txt`, {
            expectContentType: "text/plain",
            expectXml: false,
            extraChecks: (body) => ({
              hasUserAgent: /user-agent\s*:/i.test(body),
              hasSitemapDirective: /sitemap\s*:\s*https?:\/\//i.test(body),
              referencesSitemap: body.includes("/sitemap.xml"),
              disallowsAll: /disallow\s*:\s*\/\s*$/im.test(body) && !/allow\s*:\s*\//im.test(body),
            }),
          }),
        ]);

        const robotsExtrasOk =
          robots.extras.hasUserAgent === true &&
          robots.extras.referencesSitemap === true &&
          robots.extras.disallowsAll !== true;

        const allOk = sitemap.ok && robots.ok && robotsExtrasOk;

        return new Response(
          JSON.stringify(
            {
              base,
              checkedAt: new Date().toISOString(),
              ok: allOk,
              checks: { sitemap, robots: { ...robots, ok: robots.ok && robotsExtrasOk } },
            },
            null,
            2,
          ),
          {
            status: allOk ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});

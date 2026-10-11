#!/usr/bin/env node
// Automated SEO file check. Fetches robots.txt & sitemap.xml directly and
// verifies status, headers, and XML validity. Exits non-zero on failure.
// Usage: node scripts/seo-check.mjs [https://ziyarath.com]
//    or: node scripts/seo-check.mjs --via-api            (calls /api/public/seo-check)

const BASE = (process.argv.find((a) => a.startsWith("http")) ?? "https://ziyarath.com").replace(/\/$/, "");
const VIA_API = process.argv.includes("--via-api");
const UA = "ZiyarathSeoCheck/1.0 (+scripts/seo-check.mjs)";

function validateSitemap(text) {
  const t = text.trim();
  if (!t.startsWith("<?xml")) return { ok: false, error: "Missing XML declaration" };
  if (!/<urlset[\s>]|<sitemapindex[\s>]/i.test(t)) return { ok: false, error: "Missing root element" };
  if (!/<\/urlset>|<\/sitemapindex>/i.test(t)) return { ok: false, error: "Root not closed" };
  const opens = (t.match(/<url>/g) ?? []).length;
  const closes = (t.match(/<\/url>/g) ?? []).length;
  if (opens !== closes) return { ok: false, error: `Unbalanced <url> tags (${opens}/${closes})` };
  const locs = (t.match(/<loc>/g) ?? []).length;
  if (locs === 0) return { ok: false, error: "No <loc> entries" };
  return { ok: true, urlCount: opens || locs };
}

async function check(url, { expectCT, xml }) {
  const started = Date.now();
  const res = await fetch(url, { headers: { "user-agent": UA } });
  const body = await res.text();
  const ct = res.headers.get("content-type");
  const ctOk = ct?.toLowerCase().includes(expectCT) ?? false;
  const xmlResult = xml ? validateSitemap(body) : null;
  return { url, status: res.status, contentType: ct, ctOk, xml: xmlResult, bytes: body.length, body, ms: Date.now() - started };
}

function line(label, ok, detail) {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function runDirect() {
  console.log(`SEO check against ${BASE}\n`);
  const [sitemap, robots] = await Promise.all([
    check(`${BASE}/sitemap.xml`, { expectCT: "xml", xml: true }),
    check(`${BASE}/robots.txt`, { expectCT: "text/plain", xml: false }),
  ]);

  const failures = [];

  console.log("sitemap.xml");
  line(`HTTP 200 (got ${sitemap.status})`, sitemap.status === 200) || (sitemap.status !== 200 && failures.push("sitemap status"));
  line(`content-type XML (got ${sitemap.contentType})`, sitemap.ctOk) || (!sitemap.ctOk && failures.push("sitemap content-type"));
  line(`XML valid${sitemap.xml?.urlCount ? ` (${sitemap.xml.urlCount} urls)` : ""}`, sitemap.xml?.ok === true, sitemap.xml?.error);
  if (sitemap.status !== 200) failures.push("sitemap status");
  if (!sitemap.ctOk) failures.push("sitemap content-type");
  if (sitemap.xml?.ok !== true) failures.push("sitemap xml");

  console.log("\nrobots.txt");
  const hasUA = /user-agent\s*:/i.test(robots.body);
  const hasSitemap = /sitemap\s*:\s*https?:\/\//i.test(robots.body);
  const refsSitemap = robots.body.includes("/sitemap.xml");
  line(`HTTP 200 (got ${robots.status})`, robots.status === 200);
  line(`content-type text/plain (got ${robots.contentType})`, robots.ctOk);
  line(`has User-agent directive`, hasUA);
  line(`has Sitemap directive`, hasSitemap);
  line(`references /sitemap.xml`, refsSitemap);
  if (robots.status !== 200) failures.push("robots status");
  if (!robots.ctOk) failures.push("robots content-type");
  if (!hasUA) failures.push("robots user-agent");
  if (!refsSitemap) failures.push("robots sitemap ref");

  console.log(`\n${failures.length === 0 ? "✅ All checks passed" : `❌ ${failures.length} failure(s): ${failures.join(", ")}`}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

async function runViaApi() {
  const url = `${BASE}/api/public/seo-check`;
  console.log(`Calling ${url}\n`);
  const res = await fetch(url, { headers: { "user-agent": UA } });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
  process.exit(json.ok ? 0 : 1);
}

(VIA_API ? runViaApi() : runDirect()).catch((e) => {
  console.error("check crashed:", e);
  process.exit(2);
});

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

const BASE = "https://ziyarath.com";
const VERIFICATION_TOKEN = "gU5Mrgagf-0z_bJT-xy7ekCJsLdLiCwF5UWvCsQWxG4";

type CheckResult = {
  url: string;
  ok: boolean;
  status: number;
  contentType: string | null;
  bytes: number;
  snippet: string;
  error?: string;
};

async function check(url: string): Promise<CheckResult> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "ZiyarathSeoStatus/1.0" } });
    const text = await res.text();
    return {
      url,
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type"),
      bytes: text.length,
      snippet: text.slice(0, 240),
    };
  } catch (e) {
    return {
      url,
      ok: false,
      status: 0,
      contentType: null,
      bytes: 0,
      snippet: "",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkVerification(): Promise<{ ok: boolean; found: string | null; status: number; error?: string }> {
  try {
    const res = await fetch(BASE + "/", { headers: { "user-agent": "ZiyarathSeoStatus/1.0" } });
    const html = await res.text();
    const match = html.match(/<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']+)["']/i);
    return { ok: match?.[1] === VERIFICATION_TOKEN, found: match?.[1] ?? null, status: res.status };
  } catch (e) {
    return { ok: false, found: null, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

export const Route = createFileRoute("/seo-status")({
  head: () => ({
    meta: [
      { title: "SEO Status — Ziyarath" },
      { name: "description", content: "Live readiness checks for Google Search Console verification, sitemap.xml, and robots.txt." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "SEO Status — Ziyarath" },
      { property: "og:url", content: `${BASE}/seo-status` },
    ],
    links: [{ rel: "canonical", href: `${BASE}/seo-status` }],
  }),
  loader: async () => {
    const [sitemap, robots, verification] = await Promise.all([
      check(`${BASE}/sitemap.xml`),
      check(`${BASE}/robots.txt`),
      checkVerification(),
    ]);
    const robotsRefsSitemap = robots.snippet.includes("/sitemap.xml");
    return { sitemap, robots, verification, robotsRefsSitemap, checkedAt: new Date().toISOString() };
  },
  component: SeoStatusPage,
});

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{label}</div>
        <div className="mt-1 text-sm text-muted-foreground break-words">{detail}</div>
      </div>
    </div>
  );
}

function SeoStatusPage() {
  const { sitemap, robots, verification, robotsRefsSitemap, checkedAt } = Route.useLoaderData();

  const allGood = sitemap.ok && robots.ok && verification.ok && robotsRefsSitemap;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">SEO Status</h1>
          <p className="mt-2 text-muted-foreground">
            Live checks against <span className="font-mono text-sm">{BASE}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Checked {new Date(checkedAt).toLocaleString()}</p>
        </div>

        <div
          className={`mb-6 rounded-lg border p-4 ${
            allGood
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-foreground"
          }`}
        >
          <div className="font-semibold">
            {allGood ? "All checks passing — ready for Google Search Console." : "Some checks are failing."}
          </div>
          {!allGood && (
            <div className="mt-1 text-sm text-muted-foreground">
              Republish the site if you just made changes — verification and file checks run against the live domain.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <StatusRow
            ok={verification.ok}
            label="Google site verification meta tag"
            detail={
              verification.ok ? (
                <>Found matching token on the homepage.</>
              ) : verification.found ? (
                <>Meta tag present but token mismatch. Found: <span className="font-mono">{verification.found}</span></>
              ) : (
                <>Meta tag not detected (HTTP {verification.status}). Republish so the latest head tags go live.</>
              )
            }
          />

          <StatusRow
            ok={sitemap.ok && (sitemap.contentType?.includes("xml") ?? false)}
            label="/sitemap.xml is reachable"
            detail={
              <>
                HTTP {sitemap.status} · {sitemap.contentType ?? "no content-type"} · {sitemap.bytes} bytes
                <a
                  href={`${BASE}/sitemap.xml`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  open <ExternalLink className="h-3 w-3" />
                </a>
              </>
            }
          />

          <StatusRow
            ok={robots.ok}
            label="/robots.txt is reachable"
            detail={
              <>
                HTTP {robots.status} · {robots.bytes} bytes
                <a
                  href={`${BASE}/robots.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  open <ExternalLink className="h-3 w-3" />
                </a>
              </>
            }
          />

          <StatusRow
            ok={robotsRefsSitemap}
            label="robots.txt references the sitemap"
            detail={
              robotsRefsSitemap
                ? "Sitemap directive found."
                : "No Sitemap: directive pointing at /sitemap.xml."
            }
          />
        </div>

        <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-sm font-semibold text-foreground">Next steps</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open Google Search Console and add <span className="font-mono">{BASE.replace("https://", "")}</span> as a URL-prefix property.</li>
            <li>Choose the HTML tag verification method — the token above must match.</li>
            <li>After verification, submit <span className="font-mono">/sitemap.xml</span> in the Sitemaps section.</li>
          </ol>
        </div>

        <div className="mt-6">
          <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
        </div>
      </div>
    </SiteLayout>
  );
}

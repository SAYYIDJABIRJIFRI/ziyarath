import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

/**
 * Subdomain URL rewriting & 301 redirection.
 *
 * 1. Root domain (ziyarath.com):
 *    - /maqam/mampuram      → 301 redirect to https://mampuram.ziyarath.com/maqam
 *    - /uroos/mampuram-uroos → 301 redirect to https://mampuram.ziyarath.com/uroos
 *
 * 2. Registered subdomain (e.g. mampuram.ziyarath.com):
 *    - /                    → 302 redirect to /maqam on the subdomain
 *    - /maqam/mampuram      → 301 normalize to /maqam
 *    - /uroos/mampuram-uroos → 301 normalize to /uroos
import { SUBDOMAIN_REGISTRY, ROOT_DOMAIN } from "./lib/subdomain-config";
import { ensureSubdomainsLoaded } from "./lib/content-db.server";

/**
 * Subdomain URL rewriting & 301 redirection.
 *
 * 1. Root domain (ziyarath.com):
 *    - /maqam/{id}  → 301 redirect to https://{subdomain}.ziyarath.com/maqam
 *    - /uroos/{id}  → 301 redirect to https://{subdomain}.ziyarath.com/uroos
 *
 * 2. Registered subdomain (e.g. mampuram.ziyarath.com):
 *    - /            → 302 redirect to /maqam or /uroos on the subdomain
 *    - /maqam/{id}  → 301 normalize to /maqam
 *    - /uroos/{id}  → 301 normalize to /uroos
 */
function rewriteForSubdomain(request: Request): Request | Response | null {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;

  // Case 1: Main domain or www (e.g. ziyarath.com)
  // 301 permanent redirect paths to their dedicated subdomain
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    for (const [sub, entry] of Object.entries(SUBDOMAIN_REGISTRY)) {
      if (entry.maqamId && (pathname === `/maqam/${entry.maqamId}` || pathname === `/maqam/${entry.maqamId}/`)) {
        return Response.redirect(`https://${sub}.${ROOT_DOMAIN}/maqam`, 301);
      }
      if (entry.uroosId && (pathname === `/uroos/${entry.uroosId}` || pathname === `/uroos/${entry.uroosId}/`)) {
        return Response.redirect(`https://${sub}.${ROOT_DOMAIN}/uroos`, 301);
      }
    }
    return null;
  }

  // Case 2: Not on root domain — verify if subdomain
  const isLocalhost = host.endsWith(".localhost");
  if (!host.endsWith(`.${ROOT_DOMAIN}`) && !isLocalhost) return null;

  const prefix = isLocalhost
    ? host.slice(0, -".localhost".length)
    : host.slice(0, -(ROOT_DOMAIN.length + 1));

  if (!prefix || prefix === "www") return null;

  const entry = SUBDOMAIN_REGISTRY[prefix];
  if (!entry) return null;

  // Root on subdomain: redirect to /maqam (or /uroos if uroos-only target)
  if (pathname === "/" || pathname === "") {
    url.pathname = entry.maqamId ? "/maqam" : "/uroos";
    return Response.redirect(url.toString(), 302);
  }

  // If user visits /maqam/{id} on the subdomain, normalize to /maqam
  if (entry.maqamId && (pathname === `/maqam/${entry.maqamId}` || pathname === `/maqam/${entry.maqamId}/`)) {
    url.pathname = "/maqam";
    return Response.redirect(url.toString(), 301);
  }

  // If user visits /uroos/{id} on the subdomain, normalize to /uroos
  if (entry.uroosId && (pathname === `/uroos/${entry.uroosId}` || pathname === `/uroos/${entry.uroosId}/`)) {
    url.pathname = "/uroos";
    return Response.redirect(url.toString(), 301);
  }

  // General root pages redirect to the main domain
  if (
    pathname.startsWith("/about") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/privacy")
  ) {
    return Response.redirect(`https://${ROOT_DOMAIN}${pathname}${url.search}`, 302);
  }

  // /maqam and /uroos routes are natively subdomain-aware in TanStack Start
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Expose Cloudflare bindings (D1, KV, etc.) to server-only modules.
      (globalThis as { __CF_ENV__?: unknown }).__CF_ENV__ = env;

      // Ensure D1 subdomains are synchronized into SUBDOMAIN_REGISTRY
      await ensureSubdomainsLoaded();

      // --- Subdomain routing ---
      const rewritten = rewriteForSubdomain(request);
      if (rewritten instanceof Response) return rewritten; // redirect
      const effectiveRequest = rewritten ?? request;

      const handler = await getServerEntry();
      const response = await handler.fetch(effectiveRequest, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};


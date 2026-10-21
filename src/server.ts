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
 * Subdomain URL rewriting.
 * When a registered subdomain is detected (e.g. mampuram.ziyarath.com):
 *   /maqam  → /maqam/mampuram  (the maqam detail page)
 *   /uroos  → /uroos/mampuram-uroos  (the uroos detail page)
 *   /       → 302 redirect to /maqam on the same subdomain
 *
 * All other paths (assets, API calls, etc.) pass through unchanged.
 */
function rewriteForSubdomain(request: Request): Request | Response | null {
  const url = new URL(request.url);
  const host = url.hostname;

  // Quick exit for non-subdomain requests
  const ROOT_DOMAIN = "ziyarath.com";
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null;

  const prefix = host.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!prefix || prefix === "www") return null;

  // Inline registry lookup (avoids importing ESM in the worker entrypoint scope)
  const SUBDOMAIN_REGISTRY: Record<string, { maqamId: string; uroosId: string | null }> = {
    mampuram: { maqamId: "mampuram", uroosId: "mampuram-uroos" },
    // Add more here to match src/lib/subdomain-config.ts
  };

  const entry = SUBDOMAIN_REGISTRY[prefix];
  if (!entry) return null;

  const pathname = url.pathname;

  // Redirect root to /maqam on the subdomain
  if (pathname === "/" || pathname === "") {
    url.pathname = "/maqam";
    return Response.redirect(url.toString(), 302);
  }

  // Rewrite /maqam → /maqam/{maqamId}
  if (pathname === "/maqam" || pathname === "/maqam/") {
    url.pathname = `/maqam/${entry.maqamId}`;
    return new Request(url.toString(), request);
  }

  // Rewrite /uroos → /uroos/{uroosId}
  if ((pathname === "/uroos" || pathname === "/uroos/") && entry.uroosId) {
    url.pathname = `/uroos/${entry.uroosId}`;
    return new Request(url.toString(), request);
  }

  // All other paths (static assets, API, etc.) pass through unchanged
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Expose Cloudflare bindings (D1, KV, etc.) to server-only modules.
      (globalThis as { __CF_ENV__?: unknown }).__CF_ENV__ = env;

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

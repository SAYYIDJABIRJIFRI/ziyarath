import { createServerFn } from "@tanstack/react-start";
import { extractSubdomain, SUBDOMAIN_REGISTRY, type SubdomainEntry } from "./subdomain-config";
import type { DbUroos, DbMaqam } from "@/types/content";
import type { Maqam } from "@/data/maqams";

export type SubdomainMaqamResult = {
  isSubdomain: boolean;
  subdomain: string | null;
  entry: SubdomainEntry | null;
  maqam: Maqam | null;
  connectedUroos: DbUroos[];
};

export const getSubdomainMaqamFn = createServerFn({ method: "GET" })
  .validator((d?: { hostname?: string }) => d)
  .handler(async ({ data }): Promise<SubdomainMaqamResult> => {
    let host = "";
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      if (req?.url) {
        try {
          host = new URL(req.url).hostname;
        } catch {
          // ignore
        }
      }
      if (!host) {
        host =
          req?.headers?.get("x-forwarded-host") ||
          req?.headers?.get("host") ||
          "";
      }
    } catch {
      // client-side or fallback
    }

    if (!host && data?.hostname) {
      host = data.hostname;
    }
    if (!host && typeof window !== "undefined") {
      host = window.location.hostname;
    }

    const subdomain = extractSubdomain(host);
    if (subdomain && subdomain in SUBDOMAIN_REGISTRY) {
      const entry = SUBDOMAIN_REGISTRY[subdomain];
      const { getMaqamById } = await import("./content-db.server");
      const { maqam, connectedUroos } = await getMaqamById(entry.maqamId);
      return {
        isSubdomain: true,
        subdomain,
        entry,
        maqam,
        connectedUroos: connectedUroos || [],
      };
    }

    return {
      isSubdomain: false,
      subdomain: null,
      entry: null,
      maqam: null,
      connectedUroos: [],
    };
  });

export type SubdomainUroosResult = {
  isSubdomain: boolean;
  subdomain: string | null;
  entry: SubdomainEntry | null;
  uroos: DbUroos | null;
  connectedMaqam: DbMaqam | null;
};

export const getSubdomainUroosFn = createServerFn({ method: "GET" })
  .validator((d?: { hostname?: string }) => d)
  .handler(async ({ data }): Promise<SubdomainUroosResult> => {
    let host = "";
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      if (req?.url) {
        try {
          host = new URL(req.url).hostname;
        } catch {
          // ignore
        }
      }
      if (!host) {
        host =
          req?.headers?.get("x-forwarded-host") ||
          req?.headers?.get("host") ||
          "";
      }
    } catch {
      // client-side or fallback
    }

    if (!host && data?.hostname) {
      host = data.hostname;
    }
    if (!host && typeof window !== "undefined") {
      host = window.location.hostname;
    }

    const subdomain = extractSubdomain(host);
    if (subdomain && subdomain in SUBDOMAIN_REGISTRY) {
      const entry = SUBDOMAIN_REGISTRY[subdomain];
      if (entry.uroosId) {
        const { getUroosById } = await import("./content-db.server");
        const { uroos, connectedMaqam } = await getUroosById(entry.uroosId);
        return {
          isSubdomain: true,
          subdomain,
          entry,
          uroos,
          connectedMaqam,
        };
      }
    }

    return {
      isSubdomain: false,
      subdomain: null,
      entry: null,
      uroos: null,
      connectedMaqam: null,
    };
  });

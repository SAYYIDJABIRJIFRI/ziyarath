import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const RequestSchema = z.object({
  type: z.enum(["maqam", "uroos"]),
  name: z.string().trim().min(2, "Full name is too short").max(120),
  contact: z.string().trim().min(3).max(200).optional(),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{6,}$/).max(40).optional(),
  email: z.string().trim().email().max(255).optional(),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(120).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(200),
  requested_date: z.string().trim().max(120).optional().or(z.literal("")),
  details: z.string().trim().min(5).max(4000),
  supporting_notes: z.string().trim().max(2000).optional().or(z.literal("")),
  // honeypot: must be empty
  website: z.string().max(0).optional(),
  // time-trap: client sends elapsed ms since dialog opened
  elapsed_ms: z.number().int().nonnegative().optional(),
});

const MIN_FILL_MS = 2000; // form filled unrealistically fast → likely bot

const norm = (v: string | undefined | null) => {
  if (!v) return null;
  const t = v.trim();
  return t.length ? t : null;
};

export const Route = createFileRoute("/api/public/requests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "Invalid JSON" },
            { status: 400 },
          );
        }

        const parsed = RequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            {
              ok: false,
              error: "Invalid input",
              issues: parsed.error.flatten(),
            },
            { status: 400 },
          );
        }

        const d = parsed.data;

        // Honeypot + time-trap: silently accept to avoid signalling bots.
        if ((d.website && d.website.length > 0) ||
            (typeof d.elapsed_ms === "number" && d.elapsed_ms < MIN_FILL_MS)) {
          return Response.json({ ok: true });
        }

        try {
          const { getClientIp, checkAndRecord } = await import(
            "@/lib/rate-limit.server"
          );
          const ip = getClientIp(request);
          const rl = await checkAndRecord(ip);
          if (!rl.ok) {
            return Response.json(
              {
                ok: false,
                error: `Too many requests. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).`,
              },
              {
                status: 429,
                headers: { "retry-after": String(rl.retryAfterSeconds) },
              },
            );
          }

          const { insertRequest } = await import(
            "@/lib/requests-db.server"
          );
          const id = await insertRequest({
            type: d.type,
            name: d.name.trim(),
            contact:
              [d.phone, d.email].filter(Boolean).join(" | ") ||
              (d.contact ?? "").trim(),
            city: norm(d.city),
            country: norm(d.country),
            subject: d.subject.trim(),
            requested_date: norm(d.requested_date),
            details: d.details.trim(),
            supporting_notes: norm(d.supporting_notes),
          });
          return Response.json({ ok: true, id });
        } catch (err) {
          console.error("[requests] insert failed:", err);
          return Response.json(
            { ok: false, error: "Could not save request" },
            { status: 500 },
          );
        }
      },
    },
  },
});

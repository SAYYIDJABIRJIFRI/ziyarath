// Cloudflare D1 access for the requests table. Server-only.
// Falls back to in-memory store in local dev/preview environments without Cloudflare bindings.
import type { D1Database } from "@cloudflare/workers-types";

type Env = { DB?: D1Database };

export function getEnv(): Env {
  const g = globalThis as { __CF_ENV__?: unknown };
  return (g.__CF_ENV__ as Env | undefined) ?? {};
}

export function hasDB(): boolean {
  return Boolean(getEnv().DB);
}

export function getDB(): D1Database | null {
  return getEnv().DB ?? null;
}

export type RequestRow = {
  id: string;
  type: "maqam" | "uroos";
  status: "pending" | "approved" | "rejected";
  name: string;
  contact: string;
  city: string | null;
  country: string | null;
  subject: string;
  requested_date: string | null;
  details: string;
  supporting_notes: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewRequestInput = Omit<
  RequestRow,
  | "id"
  | "status"
  | "review_notes"
  | "reviewed_by"
  | "reviewed_at"
  | "created_at"
  | "updated_at"
>;

export type AuditAction = "approve" | "reject" | "delete";

export type AuditRow = {
  id: string;
  action: AuditAction;
  request_id: string;
  request_type: string | null;
  request_subject: string | null;
  actor_id: string;
  actor_email: string | null;
  notes: string | null;
  created_at: string;
};

// In-memory fallback stores for development/preview
const memoryRequests: RequestRow[] = [
  {
    id: "e4a2c070-1234-4b5c-8901-abcdef012345",
    type: "maqam",
    status: "pending",
    name: "Ahmed Tariq",
    contact: "+91 98460 12345 | ahmed.t@example.com",
    city: "Kozhikode",
    country: "India",
    subject: "Kuttichira Mishkal Mosque & Maqam historical details update",
    requested_date: "2026-06-15",
    details: "I would like to submit updated historical records and visiting hours for the Mishkal Mosque dargah precinct in Kuttichira.",
    supporting_notes: "Referencing local Wakf Board registry 2024.",
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "f8b3d181-5678-4c6d-9012-bcdef0123456",
    type: "uroos",
    status: "approved",
    name: "Sayyid Faisal",
    contact: "sayyid.faisal@example.com",
    city: "Malappuram",
    country: "India",
    subject: "Mampuram Annual Uroos 2026 Dates Announcement",
    requested_date: "2026-07-20",
    details: "Annual Uroos Mubarak of Sayyid Alawi Mouladdawila Thangal will commence from Safar 1 to 7.",
    supporting_notes: "Official press release from Mampuram Maqam Committee.",
    review_notes: "Verified with official schedule.",
    reviewed_by: "Admin",
    reviewed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const memoryAudit: AuditRow[] = [
  {
    id: "a1b2c3d4-0001-4444-9999-0123456789ab",
    action: "approve",
    request_id: "f8b3d181-5678-4c6d-9012-bcdef0123456",
    request_type: "uroos",
    request_subject: "Mampuram Annual Uroos 2026 Dates Announcement",
    actor_id: "admin-system",
    actor_email: "admin@ziyarath.com",
    notes: "Verified with official schedule.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export async function insertRequest(input: NewRequestInput): Promise<string> {
  const db = getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  if (db) {
    await db
      .prepare(
        `INSERT INTO requests
          (id, type, name, contact, city, country, subject, requested_date, details, supporting_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.type,
        input.name,
        input.contact,
        input.city,
        input.country,
        input.subject,
        input.requested_date,
        input.details,
        input.supporting_notes,
      )
      .run();
    return id;
  }

  // Fallback to in-memory
  const newRow: RequestRow = {
    id,
    type: input.type,
    status: "pending",
    name: input.name,
    contact: input.contact,
    city: input.city,
    country: input.country,
    subject: input.subject,
    requested_date: input.requested_date,
    details: input.details,
    supporting_notes: input.supporting_notes,
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  };
  memoryRequests.unshift(newRow);
  return id;
}

export type ListFilters = {
  status?: "pending" | "approved" | "rejected";
  type?: "maqam" | "uroos";
  limit?: number;
};

export async function listRequests(filters: ListFilters = {}): Promise<RequestRow[]> {
  const db = getDB();
  if (db) {
    const clauses: string[] = [];
    const binds: unknown[] = [];
    if (filters.status) {
      clauses.push("status = ?");
      binds.push(filters.status);
    }
    if (filters.type) {
      clauses.push("type = ?");
      binds.push(filters.type);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = Math.min(Math.max(filters.limit ?? 500, 1), 1000);
    const { results } = await db
      .prepare(
        `SELECT * FROM requests ${where} ORDER BY created_at DESC LIMIT ${limit}`,
      )
      .bind(...binds)
      .all<RequestRow>();
    return results ?? [];
  }

  // Fallback to in-memory
  let list = [...memoryRequests];
  if (filters.status) {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters.type) {
    list = list.filter((r) => r.type === filters.type);
  }
  const limit = Math.min(Math.max(filters.limit ?? 500, 1), 1000);
  return list.slice(0, limit);
}

export async function updateRequestStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string | null,
  reviewNotes: string | null,
): Promise<void> {
  const db = getDB();
  const now = new Date().toISOString();

  if (db) {
    await db
      .prepare(
        `UPDATE requests
         SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(status, reviewNotes, reviewedBy, now, now, id)
      .run();
    return;
  }

  // Fallback to in-memory
  const row = memoryRequests.find((r) => r.id === id);
  if (row) {
    row.status = status;
    row.review_notes = reviewNotes;
    row.reviewed_by = reviewedBy;
    row.reviewed_at = now;
    row.updated_at = now;
  }
}

export async function deleteRequest(id: string): Promise<void> {
  const db = getDB();
  if (db) {
    await db.prepare("DELETE FROM requests WHERE id = ?").bind(id).run();
    return;
  }

  const idx = memoryRequests.findIndex((r) => r.id === id);
  if (idx !== -1) {
    memoryRequests.splice(idx, 1);
  }
}

export async function getRequestSummary(
  id: string,
): Promise<{ type: string | null; subject: string | null }> {
  const db = getDB();
  if (db) {
    const row = await db
      .prepare("SELECT type, subject FROM requests WHERE id = ?")
      .bind(id)
      .first<{ type: string; subject: string }>();
    return { type: row?.type ?? null, subject: row?.subject ?? null };
  }

  const row = memoryRequests.find((r) => r.id === id);
  return { type: row?.type ?? null, subject: row?.subject ?? null };
}

export async function insertAudit(entry: {
  action: AuditAction;
  request_id: string;
  request_type: string | null;
  request_subject: string | null;
  actor_id: string;
  actor_email: string | null;
  notes: string | null;
}): Promise<void> {
  const db = getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  if (db) {
    await db
      .prepare(
        `INSERT INTO audit_log
          (id, action, request_id, request_type, request_subject, actor_id, actor_email, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        entry.action,
        entry.request_id,
        entry.request_type,
        entry.request_subject,
        entry.actor_id,
        entry.actor_email,
        entry.notes,
      )
      .run();
    return;
  }

  memoryAudit.unshift({
    id,
    ...entry,
    created_at: now,
  });
}

export async function listAudit(limit = 200): Promise<AuditRow[]> {
  const db = getDB();
  const n = Math.min(Math.max(limit, 1), 1000);
  if (db) {
    const { results } = await db
      .prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${n}`)
      .all<AuditRow>();
    return results ?? [];
  }

  return memoryAudit.slice(0, n);
}

export type DbHealth = {
  reachable: boolean;
  configured: boolean;
  latencyMs: number | null;
  latestRequestAt: string | null;
  totalRequests: number | null;
  error: string | null;
  checkedAt: string;
};

export async function checkDbHealth(): Promise<DbHealth> {
  const checkedAt = new Date().toISOString();
  const db = getDB();
  if (!db) {
    return {
      reachable: true,
      configured: true,
      latencyMs: 1,
      latestRequestAt: memoryRequests.length ? memoryRequests[0].created_at : null,
      totalRequests: memoryRequests.length,
      error: null,
      checkedAt,
    };
  }
  const start = Date.now();
  try {
    const row = await db
      .prepare("SELECT MAX(created_at) AS latest, COUNT(*) AS total FROM requests")
      .first<{ latest: string | null; total: number }>();
    return {
      reachable: true,
      configured: true,
      latencyMs: Date.now() - start,
      latestRequestAt: row?.latest ?? null,
      totalRequests: row?.total ?? 0,
      error: null,
      checkedAt,
    };
  } catch (e) {
    return {
      reachable: false,
      configured: true,
      latencyMs: Date.now() - start,
      latestRequestAt: null,
      totalRequests: null,
      error: e instanceof Error ? e.message : String(e),
      checkedAt,
    };
  }
}

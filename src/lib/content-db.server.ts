// Database and server-side state for Maqams, Uroos, Allotments, and Roles.
// Supports Cloudflare D1 with in-memory persistence fallback for local development.

import { getDB } from "./requests-db.server";
import { MAQAMS, type Maqam } from "@/data/maqams";
import { insertAudit } from "./requests-db.server";

import type { DbMaqam, DbUroos, PageAllotment, SystemUser } from "@/types/content";
export type { DbMaqam, DbUroos, PageAllotment, SystemUser };
export { insertAudit } from "./requests-db.server";
import { ALL_DEDICATED_UROOS } from "@/data/uroos-pages";

// -------------------------------------------------------------
// Seed In-Memory Store
// -------------------------------------------------------------

const seedMaqams: DbMaqam[] = MAQAMS.map((m) => ({
  ...m,
  createdFromRequestId: null,
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

const seedUroos: DbUroos[] = [...ALL_DEDICATED_UROOS];

const seedAllotments: PageAllotment[] = [
  {
    id: "allot-001",
    userId: "admin-system",
    userEmail: "admin@ziyarath.com",
    targetType: "maqam",
    targetId: "mampuram",
    targetTitle: "Mampuram Maqam",
    assignedBy: "superadmin-001",
    assignedByEmail: "superadmin@ziyarath.com",
    notes: "Assigned caretaker for Mampuram precinct updates.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "allot-002",
    userId: "admin-system",
    userEmail: "admin@ziyarath.com",
    targetType: "uroos",
    targetId: "mampuram-uroos",
    targetTitle: "Mampuram Annual Uroos Mubarak",
    assignedBy: "superadmin-001",
    assignedByEmail: "superadmin@ziyarath.com",
    notes: "Annual schedule coordinator.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
];

const seedUsers: SystemUser[] = [
  {
    id: "usr-001",
    userId: "superadmin-001",
    userEmail: "superadmin@ziyarath.com",
    role: "super_admin",
    displayName: "Chief Administrator",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-002",
    userId: "admin-system",
    userEmail: "admin@ziyarath.com",
    role: "admin",
    displayName: "Malabar Regional Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  }
];

// Memory stores
let memoryMaqams: DbMaqam[] = [...seedMaqams];
let memoryUroos: DbUroos[] = [...seedUroos];
let memoryAllotments: PageAllotment[] = [...seedAllotments];
let memoryUsers: SystemUser[] = [...seedUsers];

// -------------------------------------------------------------
// Maqam Operations
// -------------------------------------------------------------

let contentSchemaInitialized = false;

export async function ensureContentSchema(db: any): Promise<void> {
  if (contentSchemaInitialized) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS maqams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        malayalam_name TEXT,
        location TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'India',
        region TEXT NOT NULL DEFAULT 'kerala',
        category TEXT NOT NULL DEFAULT 'scholar',
        era TEXT,
        description TEXT NOT NULL,
        significance TEXT,
        best_time_to_visit TEXT,
        source_url TEXT,
        cover_image TEXT,
        address_detail TEXT,
        visiting_hours TEXT,
        facilities TEXT,
        how_to_reach TEXT,
        contact_info TEXT,
        history TEXT,
        architecture TEXT,
        created_from_request_id TEXT,
        status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE IF NOT EXISTS uroos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        malayalam_title TEXT,
        maqam_id TEXT,
        is_standalone INTEGER NOT NULL DEFAULT 0,
        resting_person TEXT,
        hijri_month INTEGER,
        hijri_month_name TEXT,
        hijri_day INTEGER,
        gregorian_date TEXT,
        recurrence TEXT,
        venue_name TEXT,
        city TEXT,
        state TEXT DEFAULT 'Kerala',
        country TEXT DEFAULT 'India',
        description TEXT NOT NULL,
        history TEXT,
        significance TEXT,
        program_schedule TEXT,
        nercha_offerings TEXT,
        how_to_reach TEXT,
        organizer_name TEXT,
        organizer_contact TEXT,
        cover_image TEXT,
        source_url TEXT,
        created_from_request_id TEXT,
        status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (maqam_id) REFERENCES maqams(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS page_allotments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('maqam', 'uroos')),
        target_id TEXT NOT NULL,
        target_title TEXT NOT NULL,
        assigned_by TEXT NOT NULL,
        assigned_by_email TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE(user_id, target_type, target_id)
      );

      CREATE TABLE IF NOT EXISTS system_roles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'user')),
        display_name TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `);
    contentSchemaInitialized = true;
  } catch (err) {
    console.warn("[D1 Content] Auto schema note:", err);
  }
}

export async function listMaqams(includeAllStatuses = false): Promise<DbMaqam[]> {
  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      const query = includeAllStatuses
        ? "SELECT * FROM maqams ORDER BY name ASC"
        : "SELECT * FROM maqams WHERE status = 'published' ORDER BY name ASC";
      const { results } = await db.prepare(query).all<Record<string, unknown>>();
      if (results && results.length > 0) {
        // Map D1 snake_case to DbMaqam
        const mapped: DbMaqam[] = results.map((r) => ({
          id: String(r.id),
          name: String(r.name),
          malayalamName: r.malayalam_name ? String(r.malayalam_name) : undefined,
          location: String(r.location),
          city: String(r.city),
          country: String(r.country || "India"),
          region: (r.region as any) || "kerala",
          category: (r.category as any) || "scholar",
          era: r.era ? String(r.era) : undefined,
          description: String(r.description || ""),
          significance: r.significance ? String(r.significance) : undefined,
          bestTimeToVisit: r.best_time_to_visit ? String(r.best_time_to_visit) : undefined,
          sourceUrl: r.source_url ? String(r.source_url) : undefined,
          coverImage: r.cover_image ? String(r.cover_image) : undefined,
          addressDetail: r.address_detail ? String(r.address_detail) : undefined,
          visitingHours: r.visiting_hours ? JSON.parse(String(r.visiting_hours)) : undefined,
          facilities: r.facilities ? JSON.parse(String(r.facilities)) : undefined,
          howToReach: r.how_to_reach ? JSON.parse(String(r.how_to_reach)) : undefined,
          contactInfo: r.contact_info ? JSON.parse(String(r.contact_info)) : undefined,
          history: r.history ? String(r.history) : undefined,
          architecture: r.architecture ? String(r.architecture) : undefined,
          createdFromRequestId: r.created_from_request_id ? String(r.created_from_request_id) : null,
          status: (r.status as any) || "published",
          createdAt: String(r.created_at),
          updatedAt: String(r.updated_at),
        }));
        return mapped;
      }
    } catch {
      // Fall through to memory
    }
  }
  return includeAllStatuses
    ? memoryMaqams
    : memoryMaqams.filter((m) => m.status === "published");
}

export async function getMaqamById(id: string): Promise<{ maqam: DbMaqam | null; connectedUroos: DbUroos[] }> {
  const allMaqams = await listMaqams(true);
  const maqam = allMaqams.find((m) => m.id === id) || null;
  const uroosList = await listUroos(true);
  const connectedUroos = uroosList.filter((u) => u.maqamId === id);
  return { maqam, connectedUroos };
}

export async function createMaqam(input: Omit<DbMaqam, "createdAt" | "updatedAt">): Promise<DbMaqam> {
  const now = new Date().toISOString();
  const item: DbMaqam = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDB();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO maqams (
            id, name, malayalam_name, location, city, country, region, category, era,
            description, significance, best_time_to_visit, source_url, cover_image,
            address_detail, visiting_hours, facilities, how_to_reach, contact_info,
            history, architecture, created_from_request_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          item.id,
          item.name,
          item.malayalamName || null,
          item.location,
          item.city,
          item.country,
          item.region,
          item.category,
          item.era || null,
          item.description,
          item.significance || null,
          item.bestTimeToVisit || null,
          item.sourceUrl || null,
          item.coverImage || null,
          item.addressDetail || null,
          item.visitingHours ? JSON.stringify(item.visitingHours) : null,
          item.facilities ? JSON.stringify(item.facilities) : null,
          item.howToReach ? JSON.stringify(item.howToReach) : null,
          item.contactInfo ? JSON.stringify(item.contactInfo) : null,
          item.history || null,
          item.architecture || null,
          item.createdFromRequestId || null,
          item.status,
          item.createdAt,
          item.updatedAt
        )
        .run();
    } catch {
      // Continue with in-memory persistence
    }
  }

  // Prepend or replace in-memory
  const idx = memoryMaqams.findIndex((m) => m.id === item.id);
  if (idx >= 0) {
    memoryMaqams[idx] = item;
  } else {
    memoryMaqams.unshift(item);
  }
  return item;
}

export async function updateMaqam(id: string, partial: Partial<DbMaqam>): Promise<DbMaqam | null> {
  const now = new Date().toISOString();
  let existing = memoryMaqams.find((m) => m.id === id);
  if (!existing) {
    const res = await getMaqamById(id);
    if (res.maqam) existing = res.maqam;
  }
  if (!existing) return null;

  const updated: DbMaqam = {
    ...existing,
    ...partial,
    updatedAt: now,
  };

  const idx = memoryMaqams.findIndex((m) => m.id === id);
  if (idx >= 0) {
    memoryMaqams[idx] = updated;
  } else {
    memoryMaqams.unshift(updated);
  }

  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      await db
        .prepare(
          `UPDATE maqams SET
            name = ?, malayalam_name = ?, location = ?, city = ?, country = ?, region = ?, category = ?,
            era = ?, description = ?, significance = ?, best_time_to_visit = ?, address_detail = ?,
            visiting_hours = ?, facilities = ?, how_to_reach = ?, contact_info = ?, history = ?,
            architecture = ?, cover_image = ?, source_url = ?, status = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          updated.name,
          updated.malayalamName || null,
          updated.location,
          updated.city,
          updated.country,
          updated.region,
          updated.category,
          updated.era || null,
          updated.description,
          updated.significance || null,
          updated.bestTimeToVisit || null,
          updated.addressDetail || null,
          updated.visitingHours ? JSON.stringify(updated.visitingHours) : null,
          updated.facilities ? JSON.stringify(updated.facilities) : null,
          updated.howToReach ? JSON.stringify(updated.howToReach) : null,
          updated.contactInfo ? JSON.stringify(updated.contactInfo) : null,
          updated.history || null,
          updated.architecture || null,
          updated.coverImage || null,
          updated.sourceUrl || null,
          updated.status || "published",
          now,
          id
        )
        .run();
    } catch (err) {
      console.warn("[D1 Content] updateMaqam error:", err);
    }
  }
  return updated;
}

// -------------------------------------------------------------
// Uroos Operations
// -------------------------------------------------------------

export async function listUroos(includeAllStatuses = false): Promise<DbUroos[]> {
  const db = getDB();
  if (db) {
    try {
      const query = includeAllStatuses
        ? "SELECT * FROM uroos ORDER BY hijri_month ASC, hijri_day ASC"
        : "SELECT * FROM uroos WHERE status = 'published' ORDER BY hijri_month ASC, hijri_day ASC";
      const { results } = await db.prepare(query).all<Record<string, unknown>>();
      if (results && results.length > 0) {
        return results.map((r) => ({
          id: String(r.id),
          title: String(r.title),
          malayalamTitle: r.malayalam_title ? String(r.malayalam_title) : undefined,
          maqamId: r.maqam_id ? String(r.maqam_id) : null,
          isStandalone: Boolean(r.is_standalone),
          restingPerson: r.resting_person ? String(r.resting_person) : undefined,
          hijriMonth: Number(r.hijri_month || 1),
          hijriMonthName: String(r.hijri_month_name || ""),
          hijriDay: Number(r.hijri_day || 1),
          gregorianDate: r.gregorian_date ? String(r.gregorian_date) : undefined,
          recurrence: r.recurrence ? String(r.recurrence) : undefined,
          venueName: r.venue_name ? String(r.venue_name) : undefined,
          city: String(r.city || ""),
          state: r.state ? String(r.state) : "Kerala",
          country: String(r.country || "India"),
          description: String(r.description || ""),
          history: r.history ? String(r.history) : undefined,
          significance: r.significance ? String(r.significance) : undefined,
          programSchedule: r.program_schedule ? JSON.parse(String(r.program_schedule)) : undefined,
          nerchaOfferings: r.nercha_offerings ? String(r.nercha_offerings) : undefined,
          howToReach: r.how_to_reach ? JSON.parse(String(r.how_to_reach)) : undefined,
          organizerName: r.organizer_name ? String(r.organizer_name) : undefined,
          organizerContact: r.organizer_contact ? String(r.organizer_contact) : undefined,
          coverImage: r.cover_image ? String(r.cover_image) : undefined,
          sourceUrl: r.source_url ? String(r.source_url) : undefined,
          createdFromRequestId: r.created_from_request_id ? String(r.created_from_request_id) : null,
          status: (r.status as any) || "published",
          createdAt: String(r.created_at),
          updatedAt: String(r.updated_at),
        }));
      }
    } catch {
      // Fallback to memory
    }
  }
  return includeAllStatuses
    ? memoryUroos
    : memoryUroos.filter((u) => u.status === "published");
}

export async function getUroosById(
  id: string
): Promise<{ uroos: DbUroos | null; connectedMaqam: DbMaqam | null }> {
  const allUroos = await listUroos(true);
  const uroos = allUroos.find((u) => u.id === id) || null;
  let connectedMaqam: DbMaqam | null = null;
  if (uroos && uroos.maqamId) {
    const maqamRes = await getMaqamById(uroos.maqamId);
    connectedMaqam = maqamRes.maqam;
  }
  return { uroos, connectedMaqam };
}

export async function createUroos(input: Omit<DbUroos, "createdAt" | "updatedAt">): Promise<DbUroos> {
  const now = new Date().toISOString();
  const item: DbUroos = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDB();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO uroos (
            id, title, malayalam_title, maqam_id, is_standalone, resting_person,
            hijri_month, hijri_month_name, hijri_day, gregorian_date, recurrence,
            venue_name, city, state, country, description, history, significance,
            program_schedule, nercha_offerings, how_to_reach, organizer_name,
            organizer_contact, cover_image, source_url, created_from_request_id,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          item.id,
          item.title,
          item.malayalamTitle || null,
          item.maqamId || null,
          item.isStandalone ? 1 : 0,
          item.restingPerson || null,
          item.hijriMonth,
          item.hijriMonthName,
          item.hijriDay,
          item.gregorianDate || null,
          item.recurrence || null,
          item.venueName || null,
          item.city,
          item.state || "Kerala",
          item.country,
          item.description,
          item.history || null,
          item.significance || null,
          item.programSchedule ? JSON.stringify(item.programSchedule) : null,
          item.nerchaOfferings || null,
          item.howToReach ? JSON.stringify(item.howToReach) : null,
          item.organizerName || null,
          item.organizerContact || null,
          item.coverImage || null,
          item.sourceUrl || null,
          item.createdFromRequestId || null,
          item.status,
          item.createdAt,
          item.updatedAt
        )
        .run();
    } catch {
      // In-memory fallback
    }
  }

  const idx = memoryUroos.findIndex((u) => u.id === item.id);
  if (idx >= 0) {
    memoryUroos[idx] = item;
  } else {
    memoryUroos.unshift(item);
  }
  return item;
}

export async function updateUroos(id: string, partial: Partial<DbUroos>): Promise<DbUroos | null> {
  const now = new Date().toISOString();
  let existing = memoryUroos.find((u) => u.id === id);
  if (!existing) {
    const res = await getUroosById(id);
    if (res.uroos) existing = res.uroos;
  }
  if (!existing) return null;

  const updated: DbUroos = {
    ...existing,
    ...partial,
    updatedAt: now,
  };

  const idx = memoryUroos.findIndex((u) => u.id === id);
  if (idx >= 0) {
    memoryUroos[idx] = updated;
  } else {
    memoryUroos.unshift(updated);
  }

  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      await db
        .prepare(
          `UPDATE uroos SET
            title = ?, malayalam_title = ?, maqam_id = ?, is_standalone = ?, resting_person = ?,
            hijri_month = ?, hijri_month_name = ?, hijri_day = ?, gregorian_date = ?, recurrence = ?,
            venue_name = ?, city = ?, state = ?, country = ?, description = ?, history = ?,
            significance = ?, program_schedule = ?, nercha_offerings = ?, how_to_reach = ?,
            organizer_name = ?, organizer_contact = ?, cover_image = ?, source_url = ?, status = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          updated.title,
          updated.malayalamTitle || null,
          updated.maqamId || null,
          updated.isStandalone ? 1 : 0,
          updated.restingPerson || null,
          updated.hijriMonth,
          updated.hijriMonthName,
          updated.hijriDay,
          updated.gregorianDate || null,
          updated.recurrence || null,
          updated.venueName || null,
          updated.city,
          updated.state || "Kerala",
          updated.country,
          updated.description,
          updated.history || null,
          updated.significance || null,
          updated.programSchedule ? JSON.stringify(updated.programSchedule) : null,
          updated.nerchaOfferings || null,
          updated.howToReach ? JSON.stringify(updated.howToReach) : null,
          updated.organizerName || null,
          updated.organizerContact || null,
          updated.coverImage || null,
          updated.sourceUrl || null,
          updated.status || "published",
          now,
          id
        )
        .run();
    } catch (err) {
      console.warn("[D1 Content] updateUroos error:", err);
    }
  }
  return updated;
}

// -------------------------------------------------------------
// Allotments Operations
// -------------------------------------------------------------

export async function listAllotments(): Promise<PageAllotment[]> {
  const db = getDB();
  if (db) {
    try {
      const { results } = await db
        .prepare("SELECT * FROM page_allotments ORDER BY created_at DESC")
        .all<Record<string, unknown>>();
      if (results && results.length > 0) {
        return results.map((r) => ({
          id: String(r.id),
          userId: String(r.user_id),
          userEmail: String(r.user_email),
          targetType: (r.target_type as any) || "maqam",
          targetId: String(r.target_id),
          targetTitle: String(r.target_title),
          assignedBy: String(r.assigned_by),
          assignedByEmail: r.assigned_by_email ? String(r.assigned_by_email) : null,
          notes: r.notes ? String(r.notes) : null,
          createdAt: String(r.created_at),
          updatedAt: String(r.updated_at),
        }));
      }
    } catch {
      // Fallback
    }
  }
  return [...memoryAllotments];
}

export async function createAllotment(input: {
  userId: string;
  userEmail: string;
  targetType: "maqam" | "uroos";
  targetId: string;
  targetTitle: string;
  assignedBy: string;
  assignedByEmail?: string | null;
  notes?: string | null;
}): Promise<PageAllotment> {
  const id = `allot-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const allotment: PageAllotment = {
    id,
    userId: input.userId,
    userEmail: input.userEmail,
    targetType: input.targetType,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    assignedBy: input.assignedBy,
    assignedByEmail: input.assignedByEmail || null,
    notes: input.notes || null,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDB();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO page_allotments
            (id, user_id, user_email, target_type, target_id, target_title, assigned_by, assigned_by_email, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, target_type, target_id) DO UPDATE SET
            notes = excluded.notes,
            assigned_by = excluded.assigned_by,
            assigned_by_email = excluded.assigned_by_email,
            updated_at = excluded.updated_at`
        )
        .bind(
          allotment.id,
          allotment.userId,
          allotment.userEmail,
          allotment.targetType,
          allotment.targetId,
          allotment.targetTitle,
          allotment.assignedBy,
          allotment.assignedByEmail,
          allotment.notes,
          allotment.createdAt,
          allotment.updatedAt
        )
        .run();
    } catch {
      // In-memory
    }
  }

  // Remove duplicate if exists in memory
  memoryAllotments = memoryAllotments.filter(
    (a) => !(a.userId === allotment.userId && a.targetType === allotment.targetType && a.targetId === allotment.targetId)
  );
  memoryAllotments.unshift(allotment);
  return allotment;
}

export async function revokeAllotment(id: string): Promise<boolean> {
  const db = getDB();
  if (db) {
    try {
      await db.prepare("DELETE FROM page_allotments WHERE id = ?").bind(id).run();
    } catch {
      // Ignore
    }
  }
  const prevLen = memoryAllotments.length;
  memoryAllotments = memoryAllotments.filter((a) => a.id !== id);
  return memoryAllotments.length < prevLen;
}

export async function getUserAllotments(userId: string, userEmail?: string | null): Promise<PageAllotment[]> {
  const all = await listAllotments();
  return all.filter((a) => a.userId === userId || (userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase()));
}

// -------------------------------------------------------------
// Role & System User Operations
// -------------------------------------------------------------

export async function listSystemUsers(): Promise<SystemUser[]> {
  const db = getDB();
  if (db) {
    try {
      const { results } = await db.prepare("SELECT * FROM system_roles").all<Record<string, unknown>>();
      if (results && results.length > 0) {
        return results.map((r) => ({
          id: String(r.id),
          userId: String(r.user_id),
          userEmail: String(r.user_email),
          role: (r.role as any) || "admin",
          displayName: String(r.display_name || r.user_email),
          createdAt: String(r.created_at),
        }));
      }
    } catch {
      // Memory fallback
    }
  }
  return [...memoryUsers];
}

export async function getUserRole(userId: string, email?: string | null): Promise<"super_admin" | "admin" | "user"> {
  // If email matches primary super admin or starts with superadmin
  if (email && (email.toLowerCase().includes("superadmin") || email.toLowerCase() === "admin@ziyarath.com")) {
    return "super_admin";
  }
  const users = await listSystemUsers();
  const match = users.find((u) => u.userId === userId || (email && u.userEmail.toLowerCase() === email.toLowerCase()));
  if (match) return match.role;
  // Default to admin for registered users in demo environment
  return "admin";
}

// -------------------------------------------------------------
// Request Approval Leading to Creation (Connected or Standalone)
// -------------------------------------------------------------

export type ApproveAndCreatePayload = {
  requestId: string;
  type: "maqam" | "uroos";
  reviewerId: string;
  reviewerEmail?: string | null;
  reviewNotes?: string;
  allotToUserEmail?: string;
  allotToUserId?: string;
  // Content payload
  data: {
    titleOrName: string;
    malayalamName?: string;
    // Maqam fields
    location?: string;
    city: string;
    country?: string;
    region?: string;
    category?: string;
    era?: string;
    addressDetail?: string;
    // Uroos fields
    isStandalone?: boolean;
    maqamId?: string | null;
    restingPerson?: string;
    hijriMonth?: number;
    hijriMonthName?: string;
    hijriDay?: number;
    gregorianDate?: string;
    recurrence?: string;
    venueName?: string;
    state?: string;
    programScheduleText?: string;
    nerchaOfferings?: string;
    organizerName?: string;
    organizerContact?: string;
    // General
    description: string;
    history?: string;
    significance?: string;
    coverImage?: string;
    visitingHoursText?: string;
    facilitiesText?: string;
    howToReachText?: string;
  };
};

export async function approveRequestAndCreate(
  payload: ApproveAndCreatePayload
): Promise<{ success: boolean; createdId: string; type: "maqam" | "uroos" }> {
  const { requestId, type, reviewerId, reviewerEmail, reviewNotes, allotToUserEmail, allotToUserId, data } = payload;
  const slug = (
    data.titleOrName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `item-${Date.now()}`
  );

  let createdId = slug;

  if (type === "maqam") {
    const newMaqam: Omit<DbMaqam, "createdAt" | "updatedAt"> = {
      id: slug,
      name: data.titleOrName,
      malayalamName: data.malayalamName || undefined,
      location: data.location || data.city,
      city: data.city,
      country: data.country || "India",
      region: (data.region as any) || "kerala",
      category: (data.category as any) || "scholar",
      era: data.era || undefined,
      description: data.description,
      significance: data.significance || undefined,
      addressDetail: data.addressDetail || `${data.titleOrName}, ${data.city}`,
      coverImage: data.coverImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200",
      visitingHours: data.visitingHoursText
        ? data.visitingHoursText.split("\n").map((line) => {
          const [label, hours] = line.split(":");
          return { label: (label || "Visiting").trim(), hours: (hours || label).trim() };
        })
        : [{ label: "General Visiting", hours: "Open daily from Fajr to Isha" }],
      facilities: data.facilitiesText
        ? data.facilitiesText.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Ablution area", "Restroom", "Parking", "Drinking water"],
      howToReach: data.howToReachText
        ? [{ mode: "Travel Guide", details: data.howToReachText }]
        : [{ mode: "By Road", details: `Accessible by local bus and taxi in ${data.city}.` }],
      history: data.history || undefined,
      createdFromRequestId: requestId,
      status: "published",
    };
    await createMaqam(newMaqam);
    createdId = newMaqam.id;
  } else {
    // Uroos
    const isStandalone = Boolean(data.isStandalone || !data.maqamId);
    const newUroos: Omit<DbUroos, "createdAt" | "updatedAt"> = {
      id: slug,
      title: data.titleOrName,
      malayalamTitle: data.malayalamName || undefined,
      maqamId: isStandalone ? null : data.maqamId || null,
      isStandalone,
      restingPerson: data.restingPerson || undefined,
      hijriMonth: data.hijriMonth || 1,
      hijriMonthName: data.hijriMonthName || "മുഹറം (Muharram)",
      hijriDay: data.hijriDay || 1,
      gregorianDate: data.gregorianDate || "Annual celebration",
      recurrence: data.recurrence || "Annual festival",
      venueName: data.venueName || (isStandalone ? `${data.titleOrName} Venue` : undefined),
      city: data.city,
      state: data.state || "Kerala",
      country: data.country || "India",
      description: data.description,
      history: data.history || undefined,
      significance: data.significance || undefined,
      programSchedule: data.programScheduleText
        ? data.programScheduleText.split("\n").map((line) => {
          const [time, event] = line.split("-");
          return { time: (time || "").trim(), event: (event || time).trim() };
        })
        : [{ time: "Daily", event: "Spiritual gatherings and Mawlid" }],
      nerchaOfferings: data.nerchaOfferings || "Traditional community feast and offerings.",
      organizerName: data.organizerName || undefined,
      organizerContact: data.organizerContact || undefined,
      coverImage: data.coverImage || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200",
      createdFromRequestId: requestId,
      status: "published",
    };
    await createUroos(newUroos);
    createdId = newUroos.id;
  }

  // Update request status in D1 / memory
  const { updateRequestStatus } = await import("./requests-db.server");
  await updateRequestStatus(
    requestId,
    "approved",
    reviewerEmail || reviewerId,
    `Approved and published as ${type} page: ${createdId}. Notes: ${reviewNotes || "Verified"}`
  );

  // If allotment specified, create page allotment record
  if (allotToUserEmail && allotToUserEmail.trim().length > 0) {
    await createAllotment({
      userId: allotToUserId || `user-${allotToUserEmail.replace(/[^a-z0-9]/gi, "")}`,
      userEmail: allotToUserEmail.trim(),
      targetType: type,
      targetId: createdId,
      targetTitle: data.titleOrName,
      assignedBy: reviewerId,
      assignedByEmail: reviewerEmail || null,
      notes: `Allotted upon request approval (${requestId}).`,
    });
  }

  // Insert audit record
  await insertAudit({
    action: "approve",
    request_id: requestId,
    request_type: type,
    request_subject: data.titleOrName,
    actor_id: reviewerId,
    actor_email: reviewerEmail || null,
    notes: `Created active ${type} page (${createdId}). Standalone: ${data.isStandalone ?? false}. Allotted to: ${allotToUserEmail || "None"}`,
  });

  return { success: true, createdId, type };
}

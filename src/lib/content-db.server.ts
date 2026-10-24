// Database and server-side state for Maqams, Uroos, Allotments, and Roles.
// Supports Cloudflare D1 with in-memory persistence fallback for local development.

import { getDB } from "./requests-db.server";
import { MAQAMS, type Maqam } from "@/data/maqams";
import { insertAudit } from "./requests-db.server";

import type { DbMaqam, DbUroos, PageAllotment, SystemUser, SubdomainMapping } from "@/types/content";
export type { DbMaqam, DbUroos, PageAllotment, SystemUser, SubdomainMapping };
export { insertAudit } from "./requests-db.server";
import { ALL_DEDICATED_UROOS } from "@/data/uroos-pages";
import { checkIsSuperAdmin } from "./auth-roles";
import { syncSubdomainRegistry, type SubdomainEntry } from "./subdomain-config";

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
  },
  {
    id: "usr-003",
    userId: "newadmin-001",
    userEmail: "newadmin@ziyarath.com",
    role: "admin",
    displayName: "New Page Admin (Unallotted)",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-004",
    userId: "sayyidjabirjifri",
    userEmail: "sayyidjabirjifri@gmail.com",
    role: "super_admin",
    displayName: "Sayyid Jabir Jifri",
    createdAt: "2026-01-01T00:00:00.000Z",
  }
];

const seedSubdomains: SubdomainMapping[] = [
  {
    subdomain: "mampuram",
    targetType: "maqam",
    targetId: "mampuram",
    targetTitle: "Mampuram Maqam",
    maqamId: "mampuram",
    uroosId: "mampuram-uroos",
    notes: "Heritage primary subdomain",
    assignedBy: "superadmin-001",
    assignedByEmail: "superadmin@ziyarath.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Memory stores
let memoryMaqams: DbMaqam[] = [...seedMaqams];
let memoryUroos: DbUroos[] = [...seedUroos];
let memoryAllotments: PageAllotment[] = [...seedAllotments];
let memoryUsers: SystemUser[] = [...seedUsers];
let memorySubdomains: SubdomainMapping[] = [...seedSubdomains];

// -------------------------------------------------------------
// Maqam Operations
// -------------------------------------------------------------

let contentSchemaInitialized = false;

export async function ensureContentSchema(db: any): Promise<void> {
  if (contentSchemaInitialized) return;
  try {
    // 1. page_allotments table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS page_allotments (
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
        )`
      )
      .run();

    // 2. system_roles table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS system_roles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          user_email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'user')),
          display_name TEXT,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )`
      )
      .run();

    // 3. maqams table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS maqams (
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
        )`
      )
      .run();

    // 4. uroos table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS uroos (
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
        )`
      )
      .run();

    // 5. subdomain_mappings table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS subdomain_mappings (
          subdomain TEXT PRIMARY KEY,
          target_type TEXT NOT NULL CHECK (target_type IN ('maqam', 'uroos')),
          target_id TEXT NOT NULL,
          target_title TEXT NOT NULL,
          maqam_id TEXT,
          uroos_id TEXT,
          notes TEXT,
          assigned_by TEXT NOT NULL,
          assigned_by_email TEXT,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )`
      )
      .run();

    // Indices
    try {
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_allotments_user ON page_allotments(user_id)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_allotments_target ON page_allotments(target_type, target_id)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_system_roles_user ON system_roles(user_id)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_maqams_region ON maqams(region)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_uroos_maqam_id ON uroos(maqam_id)").run();
      await db.prepare("CREATE INDEX IF NOT EXISTS idx_subdomains_target ON subdomain_mappings(target_type, target_id)").run();
    } catch {
      // Non-fatal
    }

    // Automatically seed all existing pages into D1 (ON CONFLICT DO NOTHING preserves any existing edits)
    await seedMissingPagesToD1(db);

    contentSchemaInitialized = true;
  } catch (err) {
    console.warn("[D1 Content] Auto schema note:", err);
  }
}

let contentSeeded = false;

export async function seedMissingPagesToD1(db: any): Promise<void> {
  if (contentSeeded) return;
  try {
    // 1. Seed seedMaqams with ON CONFLICT(id) DO NOTHING
    const insertMaqamStmt = db.prepare(`
      INSERT INTO maqams (
        id, name, malayalam_name, location, city, country, region, category, era,
        description, significance, best_time_to_visit, source_url, cover_image,
        address_detail, visiting_hours, facilities, how_to_reach, contact_info,
        history, architecture, created_from_request_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);

    for (const m of seedMaqams) {
      await insertMaqamStmt
        .bind(
          m.id,
          m.name,
          m.malayalamName || null,
          m.location,
          m.city,
          m.country || "India",
          m.region || "kerala",
          m.category || "scholar",
          m.era || null,
          m.description || "",
          m.significance || null,
          m.bestTimeToVisit || null,
          m.sourceUrl || null,
          m.coverImage || null,
          m.addressDetail || null,
          m.visitingHours ? JSON.stringify(m.visitingHours) : null,
          m.facilities ? JSON.stringify(m.facilities) : null,
          m.howToReach ? JSON.stringify(m.howToReach) : null,
          m.contactInfo ? JSON.stringify(m.contactInfo) : null,
          m.history || null,
          m.architecture || null,
          m.createdFromRequestId || null,
          m.status || "published",
          m.createdAt || "2026-01-01T00:00:00.000Z",
          m.updatedAt || "2026-01-01T00:00:00.000Z"
        )
        .run();
    }

    // 2. Seed seedUroos with ON CONFLICT(id) DO NOTHING
    const insertUroosStmt = db.prepare(`
      INSERT INTO uroos (
        id, title, malayalam_title, maqam_id, is_standalone, resting_person,
        hijri_month, hijri_month_name, hijri_day, gregorian_date, recurrence,
        venue_name, city, state, country, description, history, significance,
        program_schedule, nercha_offerings, how_to_reach, organizer_name,
        organizer_contact, cover_image, source_url, created_from_request_id,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);

    for (const u of seedUroos) {
      await insertUroosStmt
        .bind(
          u.id,
          u.title,
          u.malayalamTitle || null,
          u.maqamId || null,
          u.isStandalone ? 1 : 0,
          u.restingPerson || null,
          u.hijriMonth || 1,
          u.hijriMonthName || "",
          u.hijriDay || 1,
          u.gregorianDate || null,
          u.recurrence || null,
          u.venueName || null,
          u.city || "",
          u.state || "Kerala",
          u.country || "India",
          u.description || "",
          u.history || null,
          u.significance || null,
          u.programSchedule ? JSON.stringify(u.programSchedule) : null,
          u.nerchaOfferings || null,
          u.howToReach ? JSON.stringify(u.howToReach) : null,
          u.organizerName || null,
          u.organizerContact || null,
          u.coverImage || null,
          u.sourceUrl || null,
          u.createdFromRequestId || null,
          u.status || "published",
          u.createdAt || "2026-01-01T00:00:00.000Z",
          u.updatedAt || "2026-01-01T00:00:00.000Z"
        )
        .run();
    }

    // 3. Seed system_roles with ON CONFLICT(user_id) DO NOTHING
    const insertRoleStmt = db.prepare(`
      INSERT INTO system_roles (id, user_id, user_email, role, display_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `);
    for (const u of seedUsers) {
      await insertRoleStmt.bind(u.id, u.userId, u.userEmail, u.role, u.displayName, u.createdAt).run();
    }

    // 4. Seed initial page_allotments with ON CONFLICT(user_id, target_type, target_id) DO NOTHING
    const insertAllotStmt = db.prepare(`
      INSERT INTO page_allotments (id, user_id, user_email, target_type, target_id, target_title, assigned_by, assigned_by_email, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, target_type, target_id) DO NOTHING
    `);
    for (const a of seedAllotments) {
      await insertAllotStmt
        .bind(
          a.id,
          a.userId,
          a.userEmail,
          a.targetType,
          a.targetId,
          a.targetTitle,
          a.assignedBy,
          a.assignedByEmail,
          a.notes,
          a.createdAt,
          a.updatedAt
        )
        .run();
    }

    // 5. Seed default subdomain_mappings
    const insertSubStmt = db.prepare(`
      INSERT INTO subdomain_mappings (subdomain, target_type, target_id, target_title, maqam_id, uroos_id, notes, assigned_by, assigned_by_email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(subdomain) DO NOTHING
    `);
    for (const s of seedSubdomains) {
      await insertSubStmt
        .bind(
          s.subdomain,
          s.targetType,
          s.targetId,
          s.targetTitle,
          s.maqamId,
          s.uroosId,
          s.notes,
          s.assignedBy,
          s.assignedByEmail,
          s.createdAt,
          s.updatedAt
        )
        .run();
    }

    contentSeeded = true;
  } catch (err) {
    console.warn("[D1 Content] seedMissingPagesToD1 note:", err);
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
      const base = includeAllStatuses
        ? memoryMaqams
        : memoryMaqams.filter((m) => m.status === "published");
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
        // Merge D1 records with base seed data (D1 overrides base by id)
        const map = new Map<string, DbMaqam>();
        for (const m of base) {
          map.set(m.id, m);
        }
        for (const m of mapped) {
          map.set(m.id, m);
        }
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
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
      await ensureContentSchema(db);
      await db
        .prepare(
          `INSERT INTO maqams (
            id, name, malayalam_name, location, city, country, region, category, era,
            description, significance, best_time_to_visit, source_url, cover_image,
            address_detail, visiting_hours, facilities, how_to_reach, contact_info,
            history, architecture, created_from_request_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            malayalam_name = excluded.malayalam_name,
            location = excluded.location,
            city = excluded.city,
            country = excluded.country,
            region = excluded.region,
            category = excluded.category,
            era = excluded.era,
            description = excluded.description,
            significance = excluded.significance,
            best_time_to_visit = excluded.best_time_to_visit,
            source_url = excluded.source_url,
            cover_image = excluded.cover_image,
            address_detail = excluded.address_detail,
            visiting_hours = excluded.visiting_hours,
            facilities = excluded.facilities,
            how_to_reach = excluded.how_to_reach,
            contact_info = excluded.contact_info,
            history = excluded.history,
            architecture = excluded.architecture,
            status = excluded.status,
            updated_at = excluded.updated_at`
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
    } catch (err) {
      console.warn("[D1 Content] createMaqam error:", err);
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
          `INSERT INTO maqams (
            id, name, malayalam_name, location, city, country, region, category, era,
            description, significance, best_time_to_visit, source_url, cover_image,
            address_detail, visiting_hours, facilities, how_to_reach, contact_info,
            history, architecture, created_from_request_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            malayalam_name = excluded.malayalam_name,
            location = excluded.location,
            city = excluded.city,
            country = excluded.country,
            region = excluded.region,
            category = excluded.category,
            era = excluded.era,
            description = excluded.description,
            significance = excluded.significance,
            best_time_to_visit = excluded.best_time_to_visit,
            source_url = excluded.source_url,
            cover_image = excluded.cover_image,
            address_detail = excluded.address_detail,
            visiting_hours = excluded.visiting_hours,
            facilities = excluded.facilities,
            how_to_reach = excluded.how_to_reach,
            contact_info = excluded.contact_info,
            history = excluded.history,
            architecture = excluded.architecture,
            status = excluded.status,
            updated_at = excluded.updated_at`
        )
        .bind(
          updated.id,
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
          updated.sourceUrl || null,
          updated.coverImage || null,
          updated.addressDetail || null,
          updated.visitingHours ? JSON.stringify(updated.visitingHours) : null,
          updated.facilities ? JSON.stringify(updated.facilities) : null,
          updated.howToReach ? JSON.stringify(updated.howToReach) : null,
          updated.contactInfo ? JSON.stringify(updated.contactInfo) : null,
          updated.history || null,
          updated.architecture || null,
          updated.createdFromRequestId || null,
          updated.status || "published",
          updated.createdAt || now,
          now
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
      const base = includeAllStatuses
        ? memoryUroos
        : memoryUroos.filter((u) => u.status === "published");
      if (results && results.length > 0) {
        const mapped: DbUroos[] = results.map((r) => ({
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
        // Merge D1 records with base seed data (D1 overrides base by id)
        const map = new Map<string, DbUroos>();
        for (const u of base) {
          map.set(u.id, u);
        }
        for (const u of mapped) {
          map.set(u.id, u);
        }
        return Array.from(map.values()).sort(
          (a, b) => (a.hijriMonth || 1) - (b.hijriMonth || 1) || (a.hijriDay || 1) - (b.hijriDay || 1)
        );
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
      await ensureContentSchema(db);
      await db
        .prepare(
          `INSERT INTO uroos (
            id, title, malayalam_title, maqam_id, is_standalone, resting_person,
            hijri_month, hijri_month_name, hijri_day, gregorian_date, recurrence,
            venue_name, city, state, country, description, history, significance,
            program_schedule, nercha_offerings, how_to_reach, organizer_name,
            organizer_contact, cover_image, source_url, created_from_request_id,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            malayalam_title = excluded.malayalam_title,
            maqam_id = excluded.maqam_id,
            is_standalone = excluded.is_standalone,
            resting_person = excluded.resting_person,
            hijri_month = excluded.hijri_month,
            hijri_month_name = excluded.hijri_month_name,
            hijri_day = excluded.hijri_day,
            gregorian_date = excluded.gregorian_date,
            recurrence = excluded.recurrence,
            venue_name = excluded.venue_name,
            city = excluded.city,
            state = excluded.state,
            country = excluded.country,
            description = excluded.description,
            history = excluded.history,
            significance = excluded.significance,
            program_schedule = excluded.program_schedule,
            nercha_offerings = excluded.nercha_offerings,
            how_to_reach = excluded.how_to_reach,
            organizer_name = excluded.organizer_name,
            organizer_contact = excluded.organizer_contact,
            cover_image = excluded.cover_image,
            source_url = excluded.source_url,
            status = excluded.status,
            updated_at = excluded.updated_at`
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
    } catch (err) {
      console.warn("[D1 Content] createUroos error:", err);
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
          `INSERT INTO uroos (
            id, title, malayalam_title, maqam_id, is_standalone, resting_person,
            hijri_month, hijri_month_name, hijri_day, gregorian_date, recurrence,
            venue_name, city, state, country, description, history, significance,
            program_schedule, nercha_offerings, how_to_reach, organizer_name,
            organizer_contact, cover_image, source_url, created_from_request_id,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            malayalam_title = excluded.malayalam_title,
            maqam_id = excluded.maqam_id,
            is_standalone = excluded.is_standalone,
            resting_person = excluded.resting_person,
            hijri_month = excluded.hijri_month,
            hijri_month_name = excluded.hijri_month_name,
            hijri_day = excluded.hijri_day,
            gregorian_date = excluded.gregorian_date,
            recurrence = excluded.recurrence,
            venue_name = excluded.venue_name,
            city = excluded.city,
            state = excluded.state,
            country = excluded.country,
            description = excluded.description,
            history = excluded.history,
            significance = excluded.significance,
            program_schedule = excluded.program_schedule,
            nercha_offerings = excluded.nercha_offerings,
            how_to_reach = excluded.how_to_reach,
            organizer_name = excluded.organizer_name,
            organizer_contact = excluded.organizer_contact,
            cover_image = excluded.cover_image,
            source_url = excluded.source_url,
            status = excluded.status,
            updated_at = excluded.updated_at`
        )
        .bind(
          updated.id,
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
          updated.createdFromRequestId || null,
          updated.status || "published",
          updated.createdAt || now,
          now
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
    const fetchRows = () =>
      db.prepare("SELECT * FROM page_allotments ORDER BY created_at DESC").all<Record<string, unknown>>();

    try {
      await ensureContentSchema(db);
      const { results } = await fetchRows();
      if (results && results.length > 0) {
        const d1Allots: PageAllotment[] = results.map((r) => ({
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
        // Merge D1 allotments with memoryAllotments (deduplicating by user_email + target_type + target_id)
        const map = new Map<string, PageAllotment>();
        for (const a of memoryAllotments) {
          const key = `${a.userEmail.toLowerCase()}_${a.targetType}_${a.targetId}`;
          map.set(key, a);
        }
        for (const a of d1Allots) {
          const key = `${a.userEmail.toLowerCase()}_${a.targetType}_${a.targetId}`;
          map.set(key, a);
        }
        return Array.from(map.values());
      }
    } catch (err: any) {
      if (String(err?.message || err).includes("no such table")) {
        try {
          contentSchemaInitialized = false;
          await ensureContentSchema(db);
          const { results } = await fetchRows();
          if (results && results.length > 0) {
            const d1Allots: PageAllotment[] = results.map((r) => ({
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
            const map = new Map<string, PageAllotment>();
            for (const a of memoryAllotments) {
              const key = `${a.userEmail.toLowerCase()}_${a.targetType}_${a.targetId}`;
              map.set(key, a);
            }
            for (const a of d1Allots) {
              const key = `${a.userEmail.toLowerCase()}_${a.targetType}_${a.targetId}`;
              map.set(key, a);
            }
            return Array.from(map.values());
          }
        } catch (retryErr) {
          console.warn("[D1 Content] listAllotments retry error:", retryErr);
        }
      } else {
        console.warn("[D1 Content] listAllotments error:", err);
      }
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
    const runInsert = () =>
      db
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

    try {
      await ensureContentSchema(db);
      await runInsert();
    } catch (err: any) {
      if (String(err?.message || err).includes("no such table")) {
        try {
          contentSchemaInitialized = false;
          await ensureContentSchema(db);
          await runInsert();
        } catch (retryErr) {
          console.warn("[D1 Content] createAllotment retry error:", retryErr);
        }
      } else {
        console.warn("[D1 Content] createAllotment error:", err);
      }
    }
  }

  // Record audit log for allotment creation
  try {
    await insertAudit({
      action: "allot",
      request_id: allotment.id,
      request_type: allotment.targetType,
      request_subject: allotment.targetTitle,
      actor_id: allotment.assignedBy,
      actor_email: allotment.assignedByEmail || null,
      notes: `Allotted ${allotment.targetType} "${allotment.targetTitle}" (${allotment.targetId}) to ${allotment.userEmail}. Notes: ${allotment.notes || "None"}`,
    });
  } catch (err) {
    console.warn("[D1 Content] insertAudit for createAllotment note:", err);
  }

  // Remove duplicate if exists in memory by email + type + target
  memoryAllotments = memoryAllotments.filter(
    (a) =>
      !(
        (a.userId === allotment.userId || a.userEmail.toLowerCase() === allotment.userEmail.toLowerCase()) &&
        a.targetType === allotment.targetType &&
        a.targetId === allotment.targetId
      )
  );
  memoryAllotments.unshift(allotment);
  return allotment;
}

export async function revokeAllotment(
  id: string,
  requester?: { id?: string; email?: string | null; role?: string }
): Promise<boolean> {
  const allAllots = await listAllotments();
  const existing = allAllots.find((a) => a.id === id);

  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      await db.prepare("DELETE FROM page_allotments WHERE id = ?").bind(id).run();
    } catch (err: any) {
      if (String(err?.message || err).includes("no such table")) {
        try {
          contentSchemaInitialized = false;
          await ensureContentSchema(db);
          await db.prepare("DELETE FROM page_allotments WHERE id = ?").bind(id).run();
        } catch (retryErr) {
          console.warn("[D1 Content] revokeAllotment retry error:", retryErr);
        }
      } else {
        console.warn("[D1 Content] revokeAllotment error:", err);
      }
    }
  }
  const prevLen = memoryAllotments.length;
  memoryAllotments = memoryAllotments.filter((a) => a.id !== id);

  if (existing) {
    try {
      await insertAudit({
        action: "revoke",
        request_id: existing.id,
        request_type: existing.targetType,
        request_subject: existing.targetTitle,
        actor_id: requester?.id || "super_admin",
        actor_email: requester?.email || null,
        notes: `Revoked allotment of ${existing.targetType} "${existing.targetTitle}" (${existing.targetId}) from ${existing.userEmail}`,
      });
    } catch (err) {
      console.warn("[D1 Content] insertAudit for revokeAllotment note:", err);
    }
  }

  return true;
}

export async function getUserAllotments(userId: string, userEmail?: string | null): Promise<PageAllotment[]> {
  const all = await listAllotments();
  const normalizedEmail = userEmail?.trim().toLowerCase();
  return all.filter((a) => a.userId === userId || (normalizedEmail && a.userEmail.toLowerCase() === normalizedEmail));
}

// -------------------------------------------------------------
// Role & System User Operations
// -------------------------------------------------------------

export async function listSystemUsers(): Promise<SystemUser[]> {
  const allAllots = await listAllotments();
  const db = getDB();
  let baseUsers: SystemUser[] = [...memoryUsers];
  if (db) {
    try {
      await ensureContentSchema(db);
      const { results } = await db.prepare("SELECT * FROM system_roles").all<Record<string, unknown>>();
      if (results && results.length > 0) {
        const d1Users: SystemUser[] = results.map((r) => ({
          id: String(r.id),
          userId: String(r.user_id),
          userEmail: String(r.user_email),
          role: (r.role as any) || "admin",
          displayName: String(r.display_name || r.user_email),
          createdAt: String(r.created_at),
        }));
        const map = new Map<string, SystemUser>();
        for (const u of memoryUsers) {
          map.set(u.userEmail.toLowerCase(), u);
        }
        for (const u of d1Users) {
          map.set(u.userEmail.toLowerCase(), u);
        }
        baseUsers = Array.from(map.values());
      }
    } catch {
      // Memory fallback
    }
  }
  return baseUsers.map((u) => ({
    ...u,
    allotmentCount: allAllots.filter((a) => a.userEmail.toLowerCase() === u.userEmail.toLowerCase()).length,
  }));
}

export async function getUserRole(userId: string, email?: string | null): Promise<"super_admin" | "admin" | "user"> {
  // Check if matches Super Admin email or rule
  if (checkIsSuperAdmin(email)) {
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

// -------------------------------------------------------------
// Managed Pages & Page Edit Authorization
// -------------------------------------------------------------

export async function handleGetMyManagedPages(data: {
  userId: string;
  userEmail?: string;
  role?: "super_admin" | "admin" | "user";
}) {
  const allMaqams = await listMaqams(true);
  const allUroos = await listUroos(true);

  // Verify user's actual role from server database & identity
  const dbRole = await getUserRole(data.userId, data.userEmail);
  const hasSuperAuthority = checkIsSuperAdmin(data.userEmail, dbRole);
  
  // If client requested 'admin' persona simulation, or if user is NOT a genuine super admin:
  // strictly enforce page admin allotment restrictions
  const simulateAdmin = data.role === "admin";
  const isSuper = hasSuperAuthority && !simulateAdmin;

  if (isSuper) {
    return {
      isSuperAdmin: true,
      allottedMaqams: allMaqams,
      allottedUroos: allUroos,
    };
  }

  // Otherwise Page Admin: filter strictly by user allotments with normalized IDs
  const allotments = await getUserAllotments(data.userId, data.userEmail);
  const maqamIds = new Set(
    allotments
      .filter((a) => a.targetType.toLowerCase().trim() === "maqam")
      .map((a) => a.targetId.toLowerCase().trim())
  );
  const uroosIds = new Set(
    allotments
      .filter((a) => a.targetType.toLowerCase().trim() === "uroos")
      .map((a) => a.targetId.toLowerCase().trim())
  );

  return {
    isSuperAdmin: false,
    allottedMaqams: allMaqams.filter((m) => maqamIds.has(m.id.toLowerCase().trim())),
    allottedUroos: allUroos.filter((u) => uroosIds.has(u.id.toLowerCase().trim())),
  };
}

export async function handleUpdatePageContent(data: {
  type: "maqam" | "uroos";
  id: string;
  editorId: string;
  editorEmail?: string;
  editorRole?: "super_admin" | "admin" | "user";
  data: Record<string, unknown>;
}) {
  // Verify user's actual role from server database & identity
  const dbRole = await getUserRole(data.editorId, data.editorEmail);
  const hasSuperAuthority = checkIsSuperAdmin(data.editorEmail, dbRole);
  const simulateAdmin = data.editorRole === "admin";
  const isSuper = hasSuperAuthority && !simulateAdmin;

  const targetIdNorm = data.id.toLowerCase().trim();
  const targetTypeNorm = data.type.toLowerCase().trim();

  // Page Admin verification: MUST be allotted to this user
  if (!isSuper) {
    const allotments = await getUserAllotments(data.editorId, data.editorEmail);
    const isAllotted = allotments.some(
      (a) =>
        a.targetType.toLowerCase().trim() === targetTypeNorm &&
        a.targetId.toLowerCase().trim() === targetIdNorm
    );

    if (!isAllotted) {
      throw new Error(
        `Permission Denied: Page Admins can only edit pages allotted to them. "${data.id}" is not allotted to ${data.editorEmail || data.editorId}.`
      );
    }
  }

  let result: unknown = null;
  if (data.type === "maqam") {
    result = await updateMaqam(data.id, data.data as any);
  } else {
    result = await updateUroos(data.id, data.data as any);
  }

  if (!result) {
    throw new Error(`Failed to update ${data.type} "${data.id}": Page not found.`);
  }

  await insertAudit({
    action: "approve",
    request_id: `edit-${data.id}`,
    request_type: data.type,
    request_subject: `Updated ${data.type} ${data.id}`,
    actor_id: data.editorId,
    actor_email: data.editorEmail || null,
    notes: `Updated page content for ${data.id} by ${isSuper ? "Super Admin" : "Allotted Page Admin"}`,
  });

  return { success: true };
}

// -------------------------------------------------------------
// Subdomain Operations (Super Admin Only)
// -------------------------------------------------------------

function syncRegistryFromMappings(mappings: SubdomainMapping[]) {
  const dict: Record<string, SubdomainEntry> = {};
  for (const m of mappings) {
    dict[m.subdomain.toLowerCase().trim()] = {
      maqamId: m.maqamId,
      uroosId: m.uroosId,
      targetType: m.targetType,
      targetId: m.targetId,
      targetTitle: m.targetTitle,
    };
  }
  syncSubdomainRegistry(dict);
}

export async function listSubdomainMappings(): Promise<SubdomainMapping[]> {
  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      const { results } = await db
        .prepare("SELECT * FROM subdomain_mappings ORDER BY created_at DESC")
        .all<Record<string, unknown>>();
      if (results && results.length > 0) {
        const d1Mappings: SubdomainMapping[] = results.map((r) => ({
          subdomain: String(r.subdomain),
          targetType: (r.target_type as "maqam" | "uroos") || "maqam",
          targetId: String(r.target_id),
          targetTitle: String(r.target_title || r.target_id),
          maqamId: r.maqam_id ? String(r.maqam_id) : null,
          uroosId: r.uroos_id ? String(r.uroos_id) : null,
          notes: r.notes ? String(r.notes) : null,
          assignedBy: String(r.assigned_by || "super_admin"),
          assignedByEmail: r.assigned_by_email ? String(r.assigned_by_email) : null,
          createdAt: String(r.created_at || "2026-01-01T00:00:00.000Z"),
          updatedAt: String(r.updated_at || "2026-01-01T00:00:00.000Z"),
        }));
        memorySubdomains = d1Mappings;
        syncRegistryFromMappings(d1Mappings);
        return d1Mappings;
      }
    } catch (err) {
      console.warn("[D1 Content] listSubdomainMappings error:", err);
    }
  }
  syncRegistryFromMappings(memorySubdomains);
  return memorySubdomains;
}

export async function getSubdomainMapping(subdomain: string): Promise<SubdomainMapping | null> {
  const all = await listSubdomainMappings();
  const slug = subdomain.toLowerCase().trim();
  return all.find((m) => m.subdomain === slug) || null;
}

export type AssignSubdomainPayload = {
  subdomain: string;
  targetType: "maqam" | "uroos";
  targetId: string;
  notes?: string;
  assignedBy: string;
  assignedByEmail?: string | null;
  assignedByRole?: string;
};

export async function assignSubdomain(payload: AssignSubdomainPayload): Promise<SubdomainMapping> {
  // Authorization: Only Super Admin can assign subdomains
  const hasSuper = checkIsSuperAdmin(payload.assignedByEmail, payload.assignedByRole);
  if (!hasSuper) {
    throw new Error("Permission Denied: Only Super Admins can assign or modify dedicated subdomains.");
  }

  const rawSub = payload.subdomain.toLowerCase().trim();
  // Strip protocol, paths, or domain if user typed https://madavoor.ziyarath.com
  const slug = rawSub
    .replace(/^https?:\/\//i, "")
    .replace(/\.ziyarath\.com.*$/i, "")
    .replace(/\.localhost.*$/i, "")
    .replace(/[^a-z0-9-]/g, "")
    .trim();

  // Validate slug
  if (!slug || slug.length < 2 || slug.length > 30) {
    throw new Error("Subdomain must be between 2 and 30 characters long.");
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    throw new Error("Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with a hyphen).");
  }

  const RESERVED_SUBDOMAINS = new Set([
    "www", "api", "admin", "app", "mail", "ftp", "assets", "static", "auth",
    "dev", "staging", "ziyarath", "status", "blog", "cdn", "dns", "ns1", "ns2", "smtp", "pop", "imap", "m"
  ]);
  if (RESERVED_SUBDOMAINS.has(slug)) {
    throw new Error(`The subdomain "${slug}" is reserved for system infrastructure and cannot be assigned.`);
  }

  // Find target page title and connected items
  let targetTitle = payload.targetId;
  let maqamId: string | null = null;
  let uroosId: string | null = null;

  if (payload.targetType === "maqam") {
    const { maqam, connectedUroos } = await getMaqamById(payload.targetId);
    if (!maqam) {
      throw new Error(`Maqam page "${payload.targetId}" not found.`);
    }
    targetTitle = maqam.name;
    maqamId = maqam.id;
    if (connectedUroos && connectedUroos.length > 0) {
      uroosId = connectedUroos[0].id;
    }
  } else {
    // Uroos
    const { uroos, connectedMaqam } = await getUroosById(payload.targetId);
    if (!uroos) {
      throw new Error(`Uroos page "${payload.targetId}" not found.`);
    }
    targetTitle = uroos.title;
    uroosId = uroos.id;
    if (connectedMaqam) {
      maqamId = connectedMaqam.id;
    }
  }

  const now = new Date().toISOString();
  const mapping: SubdomainMapping = {
    subdomain: slug,
    targetType: payload.targetType,
    targetId: payload.targetId,
    targetTitle,
    maqamId,
    uroosId,
    notes: payload.notes?.trim() || null,
    assignedBy: payload.assignedBy,
    assignedByEmail: payload.assignedByEmail || null,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      await db
        .prepare(
          `INSERT INTO subdomain_mappings (
            subdomain, target_type, target_id, target_title, maqam_id, uroos_id, notes, assigned_by, assigned_by_email, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(subdomain) DO UPDATE SET
            target_type = excluded.target_type,
            target_id = excluded.target_id,
            target_title = excluded.target_title,
            maqam_id = excluded.maqam_id,
            uroos_id = excluded.uroos_id,
            notes = excluded.notes,
            assigned_by = excluded.assigned_by,
            assigned_by_email = excluded.assigned_by_email,
            updated_at = excluded.updated_at`
        )
        .bind(
          mapping.subdomain,
          mapping.targetType,
          mapping.targetId,
          mapping.targetTitle,
          mapping.maqamId,
          mapping.uroosId,
          mapping.notes,
          mapping.assignedBy,
          mapping.assignedByEmail,
          mapping.createdAt,
          mapping.updatedAt
        )
        .run();
    } catch (err: any) {
      if (String(err?.message || err).includes("no such table")) {
        contentSchemaInitialized = false;
        await ensureContentSchema(db);
        await db
          .prepare(
            `INSERT INTO subdomain_mappings (
              subdomain, target_type, target_id, target_title, maqam_id, uroos_id, notes, assigned_by, assigned_by_email, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(subdomain) DO UPDATE SET
              target_type = excluded.target_type,
              target_id = excluded.target_id,
              target_title = excluded.target_title,
              maqam_id = excluded.maqam_id,
              uroos_id = excluded.uroos_id,
              notes = excluded.notes,
              assigned_by = excluded.assigned_by,
              assigned_by_email = excluded.assigned_by_email,
              updated_at = excluded.updated_at`
          )
          .bind(
            mapping.subdomain,
            mapping.targetType,
            mapping.targetId,
            mapping.targetTitle,
            mapping.maqamId,
            mapping.uroosId,
            mapping.notes,
            mapping.assignedBy,
            mapping.assignedByEmail,
            mapping.createdAt,
            mapping.updatedAt
          )
          .run();
      } else {
        console.warn("[D1 Content] assignSubdomain D1 error:", err);
      }
    }
  }

  // Update memory
  memorySubdomains = memorySubdomains.filter((m) => m.subdomain !== slug);
  memorySubdomains.unshift(mapping);
  syncRegistryFromMappings(memorySubdomains);

  // Insert audit record
  await insertAudit({
    action: "allot",
    request_id: `subdomain-${slug}`,
    request_type: payload.targetType,
    request_subject: `${slug}.ziyarath.com -> ${targetTitle}`,
    actor_id: payload.assignedBy,
    actor_email: payload.assignedByEmail || null,
    notes: `Assigned subdomain https://${slug}.ziyarath.com to ${payload.targetType} "${targetTitle}" (${payload.targetId}). Notes: ${mapping.notes || "None"}`,
  });

  return mapping;
}

export async function removeSubdomain(
  subdomain: string,
  actor?: { id?: string; email?: string | null; role?: string }
): Promise<boolean> {
  const hasSuper = checkIsSuperAdmin(actor?.email, actor?.role);
  if (!hasSuper) {
    throw new Error("Permission Denied: Only Super Admins can remove subdomain assignments.");
  }

  const slug = subdomain.toLowerCase().trim();
  const existing = memorySubdomains.find((m) => m.subdomain === slug);

  const db = getDB();
  if (db) {
    try {
      await ensureContentSchema(db);
      await db.prepare("DELETE FROM subdomain_mappings WHERE subdomain = ?").bind(slug).run();
    } catch (err) {
      console.warn("[D1 Content] removeSubdomain error:", err);
    }
  }

  memorySubdomains = memorySubdomains.filter((m) => m.subdomain !== slug);
  syncRegistryFromMappings(memorySubdomains);

  if (existing) {
    await insertAudit({
      action: "revoke",
      request_id: `subdomain-${slug}`,
      request_type: existing.targetType,
      request_subject: `${slug}.ziyarath.com`,
      actor_id: actor?.id || "super_admin",
      actor_email: actor?.email || null,
      notes: `Removed subdomain https://${slug}.ziyarath.com previously assigned to ${existing.targetType} "${existing.targetTitle}"`,
    });
  }

  return true;
}

export async function ensureSubdomainsLoaded(): Promise<void> {
  try {
    await listSubdomainMappings();
  } catch {
    // Non-blocking
  }
}


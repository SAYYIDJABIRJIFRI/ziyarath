import { writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

// 1. Locate latest built content-db.server bundle
const assetsDir = resolve("dist/server/assets");
const files = await readdir(assetsDir);
const contentDbFile = files.find((f) => f.startsWith("content-db.server-") && f.endsWith(".js"));

if (!contentDbFile) {
  throw new Error("Could not find built content-db.server bundle in dist/server/assets");
}

console.log("Loading content bundle from:", contentDbFile);
const mod = await import(pathToFileURL(resolve(assetsDir, contentDbFile)).href);

const maqams = await mod.listMaqams(true);
const uroosList = await mod.listUroos(true);
const users = await mod.listSystemUsers();
const allotments = await mod.listAllotments();

console.log(`Found: ${maqams.length} Maqams, ${uroosList.length} Uroos, ${users.length} Users, ${allotments.length} Allotments`);

function sqlVal(val) {
  if (val === undefined || val === null) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

const lines = [
  "-- Auto-generated seed migration to populate all existing Maqam and Uroos pages into Cloudflare D1",
  "-- Uses INSERT OR IGNORE to never overwrite existing edits made in D1",
  "",
  "-- =====================================================",
  "-- 1. Seed System Roles",
  "-- =====================================================",
  ""
];

for (const u of users) {
  lines.push(
    `INSERT OR IGNORE INTO system_roles (id, user_id, user_email, role, display_name, created_at) VALUES (${sqlVal(u.id)}, ${sqlVal(u.userId)}, ${sqlVal(u.userEmail)}, ${sqlVal(u.role)}, ${sqlVal(u.displayName)}, ${sqlVal(u.createdAt)});`
  );
}

lines.push(
  "",
  "-- =====================================================",
  "-- 2. Seed All Existing Maqams",
  "-- =====================================================",
  ""
);

for (const m of maqams) {
  lines.push(
    `INSERT OR IGNORE INTO maqams (` +
      `id, name, malayalam_name, location, city, country, region, category, era, ` +
      `description, significance, best_time_to_visit, source_url, cover_image, ` +
      `address_detail, visiting_hours, facilities, how_to_reach, contact_info, ` +
      `history, architecture, created_from_request_id, status, created_at, updated_at` +
    `) VALUES (` +
      `${sqlVal(m.id)}, ` +
      `${sqlVal(m.name)}, ` +
      `${sqlVal(m.malayalamName)}, ` +
      `${sqlVal(m.location)}, ` +
      `${sqlVal(m.city)}, ` +
      `${sqlVal(m.country || "India")}, ` +
      `${sqlVal(m.region || "kerala")}, ` +
      `${sqlVal(m.category || "scholar")}, ` +
      `${sqlVal(m.era)}, ` +
      `${sqlVal(m.description || "")}, ` +
      `${sqlVal(m.significance)}, ` +
      `${sqlVal(m.bestTimeToVisit)}, ` +
      `${sqlVal(m.sourceUrl)}, ` +
      `${sqlVal(m.coverImage)}, ` +
      `${sqlVal(m.addressDetail)}, ` +
      `${sqlVal(m.visitingHours)}, ` +
      `${sqlVal(m.facilities)}, ` +
      `${sqlVal(m.howToReach)}, ` +
      `${sqlVal(m.contactInfo)}, ` +
      `${sqlVal(m.history)}, ` +
      `${sqlVal(m.architecture)}, ` +
      `${sqlVal(m.createdFromRequestId)}, ` +
      `${sqlVal(m.status || "published")}, ` +
      `${sqlVal(m.createdAt || "2026-01-01T00:00:00.000Z")}, ` +
      `${sqlVal(m.updatedAt || "2026-01-01T00:00:00.000Z")}` +
    `);`
  );
}

lines.push(
  "",
  "-- =====================================================",
  "-- 3. Seed All Existing Dedicated Uroos Pages",
  "-- =====================================================",
  ""
);

for (const u of uroosList) {
  lines.push(
    `INSERT OR IGNORE INTO uroos (` +
      `id, title, malayalam_title, maqam_id, is_standalone, resting_person, ` +
      `hijri_month, hijri_month_name, hijri_day, gregorian_date, recurrence, ` +
      `venue_name, city, state, country, description, history, significance, ` +
      `program_schedule, nercha_offerings, how_to_reach, organizer_name, ` +
      `organizer_contact, cover_image, source_url, created_from_request_id, ` +
      `status, created_at, updated_at` +
    `) VALUES (` +
      `${sqlVal(u.id)}, ` +
      `${sqlVal(u.title)}, ` +
      `${sqlVal(u.malayalamTitle)}, ` +
      `${sqlVal(u.maqamId)}, ` +
      `${sqlVal(u.isStandalone ? 1 : 0)}, ` +
      `${sqlVal(u.restingPerson)}, ` +
      `${sqlVal(u.hijriMonth || 1)}, ` +
      `${sqlVal(u.hijriMonthName)}, ` +
      `${sqlVal(u.hijriDay || 1)}, ` +
      `${sqlVal(u.gregorianDate)}, ` +
      `${sqlVal(u.recurrence)}, ` +
      `${sqlVal(u.venueName)}, ` +
      `${sqlVal(u.city)}, ` +
      `${sqlVal(u.state || "Kerala")}, ` +
      `${sqlVal(u.country || "India")}, ` +
      `${sqlVal(u.description || "")}, ` +
      `${sqlVal(u.history)}, ` +
      `${sqlVal(u.significance)}, ` +
      `${sqlVal(u.programSchedule)}, ` +
      `${sqlVal(u.nerchaOfferings)}, ` +
      `${sqlVal(u.howToReach)}, ` +
      `${sqlVal(u.organizerName)}, ` +
      `${sqlVal(u.organizerContact)}, ` +
      `${sqlVal(u.coverImage)}, ` +
      `${sqlVal(u.sourceUrl)}, ` +
      `${sqlVal(u.createdFromRequestId)}, ` +
      `${sqlVal(u.status || "published")}, ` +
      `${sqlVal(u.createdAt || "2026-01-01T00:00:00.000Z")}, ` +
      `${sqlVal(u.updatedAt || "2026-01-01T00:00:00.000Z")}` +
    `);`
  );
}

lines.push(
  "",
  "-- =====================================================",
  "-- 4. Seed Initial Caretaker Allotments",
  "-- =====================================================",
  ""
);

for (const a of allotments) {
  lines.push(
    `INSERT OR IGNORE INTO page_allotments (` +
      `id, user_id, user_email, target_type, target_id, target_title, assigned_by, assigned_by_email, notes, created_at, updated_at` +
    `) VALUES (` +
      `${sqlVal(a.id)}, ` +
      `${sqlVal(a.userId)}, ` +
      `${sqlVal(a.userEmail)}, ` +
      `${sqlVal(a.targetType)}, ` +
      `${sqlVal(a.targetId)}, ` +
      `${sqlVal(a.targetTitle)}, ` +
      `${sqlVal(a.assignedBy)}, ` +
      `${sqlVal(a.assignedByEmail)}, ` +
      `${sqlVal(a.notes)}, ` +
      `${sqlVal(a.createdAt || "2026-01-01T00:00:00.000Z")}, ` +
      `${sqlVal(a.updatedAt || "2026-01-01T00:00:00.000Z")}` +
    `);`
  );
}

const finalSql = lines.join("\n") + "\n";
const migrationPath = resolve("migrations/0005_seed_all_content.sql");
await writeFile(migrationPath, finalSql, "utf-8");
console.log("Written migration to:", migrationPath);

// Verify with node:sqlite
console.log("Verifying migration syntax in SQLite...");
const testDb = new DatabaseSync(":memory:");
testDb.exec(await (await import("node:fs/promises")).readFile("migrations/0004_content_and_allotments.sql", "utf-8"));
testDb.exec(finalSql);

const maqamCount = testDb.prepare("SELECT COUNT(*) as count FROM maqams").get();
const uroosCount = testDb.prepare("SELECT COUNT(*) as count FROM uroos").get();
const userCount = testDb.prepare("SELECT COUNT(*) as count FROM system_roles").get();
const allotCount = testDb.prepare("SELECT COUNT(*) as count FROM page_allotments").get();

console.log("Verification results in SQLite:");
console.log(`- Maqams: ${maqamCount.count}`);
console.log(`- Uroos: ${uroosCount.count}`);
console.log(`- Users: ${userCount.count}`);
console.log(`- Allotments: ${allotCount.count}`);
console.log("✓ Migration 0005 verified successfully with 0 errors!");

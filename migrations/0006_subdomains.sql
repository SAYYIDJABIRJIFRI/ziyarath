-- Dynamic Subdomain Mappings schema for Cloudflare D1
-- Allows Super Admins to assign dedicated subdomains (e.g., madavoor.ziyarath.com) to Maqam and Uroos pages

CREATE TABLE IF NOT EXISTS subdomain_mappings (
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
);

CREATE INDEX IF NOT EXISTS idx_subdomains_target ON subdomain_mappings(target_type, target_id);

-- Seed initial default heritage subdomain for Mampuram
INSERT OR IGNORE INTO subdomain_mappings (
  subdomain, target_type, target_id, target_title, maqam_id, uroos_id, notes, assigned_by, assigned_by_email
) VALUES (
  'mampuram', 'maqam', 'mampuram', 'Mampuram Maqam', 'mampuram', 'mampuram-uroos', 'Heritage primary subdomain', 'system', 'superadmin@ziyarath.com'
);

-- Dynamic Maqams, Uroos, Allotments, and Roles schema for Cloudflare D1

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
  visiting_hours TEXT, -- JSON array of {label, hours}
  facilities TEXT, -- JSON array of string tags
  how_to_reach TEXT, -- JSON array of {mode, details}
  contact_info TEXT, -- JSON object {phone, email, website}
  history TEXT,
  architecture TEXT,
  created_from_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_maqams_region ON maqams(region);
CREATE INDEX IF NOT EXISTS idx_maqams_category ON maqams(category);
CREATE INDEX IF NOT EXISTS idx_maqams_status ON maqams(status);

CREATE TABLE IF NOT EXISTS uroos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  malayalam_title TEXT,
  maqam_id TEXT, -- Nullable: if present, connected to a Maqam. If null, standalone.
  is_standalone INTEGER NOT NULL DEFAULT 0, -- 1 = standalone, 0 = connected
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
  program_schedule TEXT, -- JSON array of {time, event, description}
  nercha_offerings TEXT,
  how_to_reach TEXT, -- JSON array of {mode, details}
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

CREATE INDEX IF NOT EXISTS idx_uroos_maqam_id ON uroos(maqam_id);
CREATE INDEX IF NOT EXISTS idx_uroos_hijri_month ON uroos(hijri_month);
CREATE INDEX IF NOT EXISTS idx_uroos_status ON uroos(status);
CREATE INDEX IF NOT EXISTS idx_uroos_standalone ON uroos(is_standalone);

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

CREATE INDEX IF NOT EXISTS idx_allotments_user ON page_allotments(user_id);
CREATE INDEX IF NOT EXISTS idx_allotments_target ON page_allotments(target_type, target_id);

CREATE TABLE IF NOT EXISTS system_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'user')),
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_system_roles_user ON system_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_system_roles_role ON system_roles(role);

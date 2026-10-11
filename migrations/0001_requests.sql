-- Cloudflare D1 schema for maqam / uroos submission requests
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('maqam', 'uroos')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  city TEXT,
  country TEXT,
  subject TEXT NOT NULL,
  requested_date TEXT,
  details TEXT NOT NULL,
  supporting_notes TEXT,
  review_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

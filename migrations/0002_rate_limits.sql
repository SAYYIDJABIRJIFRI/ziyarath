-- Per-IP request log for lightweight rate limiting.
CREATE TABLE IF NOT EXISTS request_hits (
  ip TEXT NOT NULL,
  created_at INTEGER NOT NULL -- unix seconds
);
CREATE INDEX IF NOT EXISTS idx_request_hits_ip_time
  ON request_hits (ip, created_at);

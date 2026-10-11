-- Admin audit log for request actions
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'delete')),
  request_id TEXT NOT NULL,
  request_type TEXT,
  request_subject TEXT,
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_log(request_id);

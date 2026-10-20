CREATE TABLE report_history (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('individual', 'collective')),
  period_from TEXT NOT NULL,
  period_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  storage_key TEXT,
  file_name TEXT,
  content_type TEXT,
  file_size INTEGER,
  business_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  error_message TEXT
);

CREATE INDEX idx_report_history_created_at
ON report_history (created_at);

CREATE INDEX idx_report_history_type_created
ON report_history (report_type, created_at);

CREATE TABLE report_history_businesses (
  report_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  included INTEGER NOT NULL CHECK (included IN (0, 1)),
  exclusion_reason TEXT,
  PRIMARY KEY (report_id, business_id),
  FOREIGN KEY (report_id) REFERENCES report_history(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_report_history_businesses_business
ON report_history_businesses (business_id);
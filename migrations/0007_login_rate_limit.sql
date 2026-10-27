CREATE TABLE IF NOT EXISTS login_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

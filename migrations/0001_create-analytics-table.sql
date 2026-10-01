CREATE TABLE analytics_daily (
  business_id TEXT NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('nfc', 'qr', 'direct')),
  visits INTEGER NOT NULL DEFAULT 0,
  google_clicks INTEGER NOT NULL DEFAULT 0,
  last_activity TEXT NOT NULL,

  PRIMARY KEY (business_id, date, source)
);

CREATE INDEX idx_analytics_daily_business_date
ON analytics_daily (business_id, date);
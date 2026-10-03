ALTER TABLE businesses
ADD COLUMN created_at TEXT;

UPDATE businesses
SET created_at = (
  SELECT MIN(analytics_daily.date)
  FROM analytics_daily
  WHERE analytics_daily.business_id = businesses.id
)
WHERE created_at IS NULL;

UPDATE businesses
SET created_at = date('now')
WHERE created_at IS NULL;
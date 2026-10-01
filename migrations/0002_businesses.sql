CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  google_review_url TEXT NOT NULL,
  logo_url TEXT
);

INSERT INTO businesses (
  id,
  name,
  slug,
  google_review_url,
  logo_url
)
VALUES
  (
    'bar-pepe',
    'Bar Pepe',
    'bar-pepe',
    'https://www.google.com/',
    NULL
  ),
  (
    'cafeteria-lola',
    'Cafetería Lola',
    'cafeteria-lola',
    'https://www.google.com/',
    NULL
  );
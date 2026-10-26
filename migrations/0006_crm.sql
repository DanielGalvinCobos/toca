CREATE TABLE crm_clients (
  id TEXT PRIMARY KEY,
  contact_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  wants_email_alerts INTEGER NOT NULL DEFAULT 0
    CHECK (wants_email_alerts IN (0, 1)),
  wants_statistics INTEGER NOT NULL DEFAULT 0
    CHECK (wants_statistics IN (0, 1)),
  subscription_status TEXT NOT NULL DEFAULT 'undecided'
    CHECK (
      subscription_status IN (
        'undecided',
        'active',
        'inactive',
        'cancelled'
      )
    ),
  notes TEXT,
  archived_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_crm_clients_business_name
  ON crm_clients (business_name);

CREATE INDEX idx_crm_clients_contact_name
  ON crm_clients (contact_name);

CREATE INDEX idx_crm_clients_email
  ON crm_clients (email);

CREATE INDEX idx_crm_clients_archived
  ON crm_clients (archived_at);

CREATE TABLE crm_purchases (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  product TEXT NOT NULL,
  version TEXT,
  units INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id)
    REFERENCES crm_clients(id)
    ON DELETE RESTRICT
);

CREATE INDEX idx_crm_purchases_client_date
  ON crm_purchases (client_id, purchase_date DESC);

CREATE TABLE crm_interactions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  interaction_date TEXT NOT NULL DEFAULT (datetime('now')),
  interaction_type TEXT NOT NULL
    CHECK (
      interaction_type IN (
        'call',
        'email',
        'meeting',
        'message',
        'other'
      )
    ),
  summary TEXT NOT NULL,
  outcome TEXT,
  follow_up_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id)
    REFERENCES crm_clients(id)
    ON DELETE RESTRICT
);

CREATE INDEX idx_crm_interactions_client_date
  ON crm_interactions (client_id, interaction_date DESC);

CREATE INDEX idx_crm_interactions_follow_up
  ON crm_interactions (follow_up_date);
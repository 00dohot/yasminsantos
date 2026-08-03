CREATE TABLE IF NOT EXISTS payments (
  transaction_id TEXT PRIMARY KEY,
  external_reference TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL CHECK (product IN ('site', 'privacy')),
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  access_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_external_reference
  ON payments(external_reference);

ALTER TABLE people ADD COLUMN IF NOT EXISTS headstone_photo_url TEXT;

CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  submitter_user_id TEXT NOT NULL,
  submitter_email TEXT,
  person_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  photo_url TEXT,
  headstone_photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

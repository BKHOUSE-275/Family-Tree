CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id TEXT NOT NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_id TEXT,
  entity_label TEXT NOT NULL,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS committee_invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL,
  invited_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

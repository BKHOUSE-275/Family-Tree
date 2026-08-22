CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  given_name TEXT NOT NULL,
  surname TEXT NOT NULL DEFAULT '',
  nickname TEXT,
  suffix TEXT,
  photo_url TEXT,
  birth_date TEXT,
  birth_place TEXT,
  death_date TEXT,
  is_deceased BOOLEAN NOT NULL DEFAULT false,
  headstone_location TEXT,
  familysearch_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  person_id TEXT PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  address TEXT,
  phone TEXT,
  email TEXT,
  share_address BOOLEAN NOT NULL DEFAULT false,
  share_phone BOOLEAN NOT NULL DEFAULT false,
  share_email BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS parent_children (
  parent_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, child_id)
);

CREATE TABLE IF NOT EXISTS partnerships (
  id TEXT PRIMARY KEY,
  person_a_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person_b_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  start_date TEXT,
  place TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS residences (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  year TEXT,
  place TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS siblings (
  person_a_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person_b_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (person_a_id, person_b_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  person_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member',
  email TEXT
);

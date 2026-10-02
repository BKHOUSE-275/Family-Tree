CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  cover_item_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  url TEXT NOT NULL,
  display_url TEXT NOT NULL,
  thumb_url TEXT,
  content_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  caption TEXT,
  taken_date TEXT,
  uploader_user_id TEXT,
  uploader_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_items_album_idx ON gallery_items (album_id, created_at);

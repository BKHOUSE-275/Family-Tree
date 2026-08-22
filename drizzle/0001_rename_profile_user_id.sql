-- If you already created profiles with clerk_user_id, run this once in Neon SQL.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'clerk_user_id'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN clerk_user_id TO user_id;
  END IF;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

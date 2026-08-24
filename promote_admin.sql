-- ============================================================
--  Playpile — Add admin column + promote noam1216@hotmail.com
-- ============================================================
--  Run this in your Supabase project → SQL Editor
--  (https://supabase.com/dashboard/project/_/sql)
-- ============================================================

-- 1. Add `is_admin` column to the `profiles` table (safe idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Promote the account registered with noam1216@hotmail.com to admin
--    (Looks up the user in auth.users by email and updates the matching profile row)
UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'noam1216@hotmail.com'
  LIMIT 1
);

-- --------------------------------------------------------------
--  Optional — sanity check. Should return 1 row with is_admin=t
-- --------------------------------------------------------------
-- SELECT p.id, u.email, p.tier, p.is_admin
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE u.email = 'noam1216@hotmail.com';

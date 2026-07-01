-- PostgREST embed: household_members ... profiles(display_name)
-- Requires a direct FK from household_members.user_id -> profiles.id

ALTER TABLE household_members
  DROP CONSTRAINT IF EXISTS household_members_user_id_profiles_fkey;

ALTER TABLE household_members
  ADD CONSTRAINT household_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Refresh PostgREST schema cache (Supabase picks this up automatically; NOTIFY helps on self-hosted)
NOTIFY pgrst, 'reload schema';

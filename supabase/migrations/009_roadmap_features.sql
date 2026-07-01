-- Roadmap: multi-household membership, guests, custom pet schedules

-- ---------------------------------------------------------------------------
-- Household members
-- ---------------------------------------------------------------------------

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users ON DELETE SET NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_household_id uuid REFERENCES households ON DELETE SET NULL;

CREATE TABLE household_members (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES households ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  valid_from date,
  valid_until date,
  valid_days_of_week int[],
  invited_by uuid REFERENCES auth.users ON DELETE SET NULL,
  PRIMARY KEY (user_id, household_id)
);

CREATE INDEX idx_household_members_household ON household_members (household_id);

-- Migrate existing single-household profiles
WITH ranked AS (
  SELECT
    id,
    household_id,
    ROW_NUMBER() OVER (PARTITION BY household_id ORDER BY created_at ASC) AS rn
  FROM profiles
  WHERE household_id IS NOT NULL
)
INSERT INTO household_members (user_id, household_id, role)
SELECT id, household_id, CASE WHEN rn = 1 THEN 'owner' ELSE 'member' END
FROM ranked
ON CONFLICT DO NOTHING;

UPDATE households h
SET created_by = hm.user_id
FROM household_members hm
WHERE hm.household_id = h.id
  AND hm.role = 'owner'
  AND h.created_by IS NULL;

UPDATE profiles
SET active_household_id = household_id
WHERE household_id IS NOT NULL
  AND active_household_id IS NULL;

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Custom pet schedules
-- ---------------------------------------------------------------------------

CREATE TABLE pet_schedules (
  pet_id uuid PRIMARY KEY REFERENCES pets(id) ON DELETE CASCADE,
  base_plan_id text REFERENCES schedule_plans(id) ON DELETE SET NULL,
  is_customized boolean NOT NULL DEFAULT false,
  customized_at timestamptz,
  customized_by uuid REFERENCES auth.users ON DELETE SET NULL
);

CREATE TABLE pet_schedule_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  time_label text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'potty', 'feed', 'sleep', 'play', 'train', 'wind', 'night',
    'groom', 'vet', 'enrich', 'note'
  )),
  title text NOT NULL,
  subtitle text,
  icon text NOT NULL DEFAULT '•',
  section text NOT NULL
);

CREATE INDEX idx_pet_schedule_tasks_pet ON pet_schedule_tasks (pet_id, sort_order);

ALTER TABLE pet_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_schedule_tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE completions DROP CONSTRAINT IF EXISTS completions_task_id_fkey;

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_active_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT active_household_id FROM profiles WHERE id = auth.uid()),
    (SELECT household_id FROM profiles WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION auth_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth_active_household_id();
$$;

CREATE OR REPLACE FUNCTION auth_is_household_member(hhid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM household_members hm
    WHERE hm.user_id = auth.uid()
      AND hm.household_id = hhid
      AND (
        hm.role IN ('owner', 'admin', 'member')
        OR (
          hm.role = 'guest'
          AND (hm.valid_from IS NULL OR CURRENT_DATE >= hm.valid_from)
          AND (hm.valid_until IS NULL OR CURRENT_DATE <= hm.valid_until)
          AND (
            hm.valid_days_of_week IS NULL
            OR cardinality(hm.valid_days_of_week) = 0
            OR EXTRACT(DOW FROM CURRENT_DATE)::int = ANY (hm.valid_days_of_week)
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION auth_household_role(hhid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hm.role
  FROM household_members hm
  WHERE hm.user_id = auth.uid()
    AND hm.household_id = hhid
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_can_manage_household(hhid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth_household_role(hhid) IN ('owner', 'admin');
$$;

-- ---------------------------------------------------------------------------
-- RLS: household_members
-- ---------------------------------------------------------------------------

CREATE POLICY "Members can read household membership"
  ON household_members FOR SELECT
  USING (auth_is_household_member(household_id) OR user_id = auth.uid());

CREATE POLICY "Users can read own memberships"
  ON household_members FOR SELECT
  USING (user_id = auth.uid());

-- Mutations via RPC only

-- ---------------------------------------------------------------------------
-- RLS: households (replace)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can read own household" ON households;
DROP POLICY IF EXISTS "Members can update own household" ON households;

CREATE POLICY "Members can read household"
  ON households FOR SELECT
  USING (auth_is_household_member(id));

CREATE POLICY "Managers can update household"
  ON households FOR UPDATE
  USING (auth_can_manage_household(id));

-- ---------------------------------------------------------------------------
-- RLS: profiles (replace read)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read household profiles" ON profiles;

CREATE POLICY "Users can read household profiles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM household_members hm_self
      JOIN household_members hm_other ON hm_other.household_id = hm_self.household_id
      WHERE hm_self.user_id = auth.uid()
        AND hm_other.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: pets (replace)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can read household pets" ON pets;
DROP POLICY IF EXISTS "Members can insert household pets" ON pets;
DROP POLICY IF EXISTS "Members can update household pets" ON pets;
DROP POLICY IF EXISTS "Members can delete household pets" ON pets;

CREATE POLICY "Members can read household pets"
  ON pets FOR SELECT
  USING (auth_is_household_member(household_id));

CREATE POLICY "Members can insert household pets"
  ON pets FOR INSERT
  WITH CHECK (
    auth_is_household_member(household_id)
    AND auth_household_role(household_id) IN ('owner', 'admin', 'member')
  );

CREATE POLICY "Members can update household pets"
  ON pets FOR UPDATE
  USING (
    auth_is_household_member(household_id)
    AND auth_household_role(household_id) IN ('owner', 'admin', 'member')
  );

CREATE POLICY "Members can delete household pets"
  ON pets FOR DELETE
  USING (
    auth_is_household_member(household_id)
    AND auth_household_role(household_id) IN ('owner', 'admin', 'member')
  );

-- ---------------------------------------------------------------------------
-- RLS: completions (replace)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can read completions" ON completions;
DROP POLICY IF EXISTS "Members can insert completions" ON completions;
DROP POLICY IF EXISTS "Members can delete completions" ON completions;

CREATE POLICY "Members can read completions"
  ON completions FOR SELECT
  USING (auth_is_household_member(household_id));

CREATE POLICY "Members can insert completions"
  ON completions FOR INSERT
  WITH CHECK (
    auth_is_household_member(household_id)
    AND completed_by = auth.uid()
  );

CREATE POLICY "Members can delete completions"
  ON completions FOR DELETE
  USING (auth_is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- RLS: pet schedules
-- ---------------------------------------------------------------------------

CREATE POLICY "Members can read pet schedules"
  ON pet_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_schedules.pet_id
        AND auth_is_household_member(p.household_id)
    )
  );

CREATE POLICY "Members can manage pet schedules"
  ON pet_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_schedules.pet_id
        AND auth_is_household_member(p.household_id)
        AND auth_household_role(p.household_id) IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_schedules.pet_id
        AND auth_is_household_member(p.household_id)
        AND auth_household_role(p.household_id) IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can read pet schedule tasks"
  ON pet_schedule_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_schedule_tasks.pet_id
        AND auth_is_household_member(p.household_id)
    )
  );

CREATE POLICY "Members can manage pet schedule tasks"
  ON pet_schedule_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_schedule_tasks.pet_id
        AND auth_is_household_member(p.household_id)
        AND auth_household_role(p.household_id) IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_schedule_tasks.pet_id
        AND auth_is_household_member(p.household_id)
        AND auth_household_role(p.household_id) IN ('owner', 'admin', 'member')
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: create_household (replace)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_household(household_name text, invite text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household households%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO households (name, invite_code, created_by)
  VALUES (household_name, upper(trim(invite)), auth.uid())
  RETURNING * INTO new_household;

  INSERT INTO household_members (user_id, household_id, role)
  VALUES (auth.uid(), new_household.id, 'owner');

  UPDATE profiles
  SET
    household_id = COALESCE(household_id, new_household.id),
    active_household_id = new_household.id
  WHERE id = auth.uid();

  RETURN row_to_json(new_household);
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: join_household_by_invite (replace)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION join_household_by_invite(invite text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  household_uuid uuid;
BEGIN
  SELECT id INTO household_uuid
  FROM households
  WHERE invite_code = upper(trim(invite));

  IF household_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO household_members (user_id, household_id, role)
  VALUES (auth.uid(), household_uuid, 'member')
  ON CONFLICT (user_id, household_id) DO NOTHING;

  UPDATE profiles
  SET
    household_id = COALESCE(household_id, household_uuid),
    active_household_id = household_uuid
  WHERE id = auth.uid();

  RETURN household_uuid;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: set_active_household
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_active_household(p_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT auth_is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  UPDATE profiles
  SET active_household_id = p_household_id
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION set_active_household(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: leave_household
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION leave_household(p_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_role text;
BEGIN
  SELECT role INTO member_role
  FROM household_members
  WHERE user_id = auth.uid() AND household_id = p_household_id;

  IF member_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  IF member_role = 'owner' THEN
    RAISE EXCEPTION 'Owners cannot leave a household they own';
  END IF;

  DELETE FROM household_members
  WHERE user_id = auth.uid() AND household_id = p_household_id;

  UPDATE profiles
  SET
    active_household_id = (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
      ORDER BY joined_at ASC
      LIMIT 1
    ),
    household_id = COALESCE(
      (
        SELECT household_id
        FROM household_members
        WHERE user_id = auth.uid()
        ORDER BY joined_at ASC
        LIMIT 1
      ),
      NULL
    )
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION leave_household(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: remove_household_member
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION remove_household_member(p_household_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role text;
  target_role text;
BEGIN
  actor_role := auth_household_role(p_household_id);
  IF actor_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT role INTO target_role
  FROM household_members
  WHERE user_id = p_user_id AND household_id = p_household_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Use leave_household to remove yourself';
  END IF;

  IF actor_role = 'admin' AND target_role IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  DELETE FROM household_members
  WHERE user_id = p_user_id AND household_id = p_household_id;

  UPDATE profiles
  SET
    active_household_id = (
      SELECT household_id
      FROM household_members
      WHERE user_id = p_user_id
      ORDER BY joined_at ASC
      LIMIT 1
    ),
    household_id = (
      SELECT household_id
      FROM household_members
      WHERE user_id = p_user_id
      ORDER BY joined_at ASC
      LIMIT 1
    )
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_household_member(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: add_guest_by_email
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION add_guest_by_email(
  p_household_id uuid,
  p_email text,
  p_valid_from date,
  p_valid_until date,
  p_valid_days int[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_user_id uuid;
BEGIN
  IF NOT auth_can_manage_household(p_household_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT id INTO guest_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF guest_user_id IS NULL THEN
    RAISE EXCEPTION 'No account found for that email';
  END IF;

  INSERT INTO household_members (
    user_id,
    household_id,
    role,
    valid_from,
    valid_until,
    valid_days_of_week,
    invited_by
  )
  VALUES (
    guest_user_id,
    p_household_id,
    'guest',
    p_valid_from,
    p_valid_until,
    p_valid_days,
    auth.uid()
  )
  ON CONFLICT (user_id, household_id) DO UPDATE
  SET
    role = 'guest',
    valid_from = EXCLUDED.valid_from,
    valid_until = EXCLUDED.valid_until,
    valid_days_of_week = EXCLUDED.valid_days_of_week,
    invited_by = EXCLUDED.invited_by;

  RETURN guest_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_guest_by_email(uuid, text, date, date, int[]) TO authenticated;

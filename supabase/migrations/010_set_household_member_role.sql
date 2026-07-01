-- RPC: set_household_member_role (owner promotes/demotes member ↔ admin)

CREATE OR REPLACE FUNCTION set_household_member_role(
  p_household_id uuid,
  p_user_id uuid,
  p_role text
)
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
  IF actor_role <> 'owner' THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF p_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  SELECT role INTO target_role
  FROM household_members
  WHERE user_id = p_user_id AND household_id = p_household_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF target_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Cannot change role for this member';
  END IF;

  UPDATE household_members
  SET role = p_role
  WHERE user_id = p_user_id AND household_id = p_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_household_member_role(uuid, uuid, text) TO authenticated;

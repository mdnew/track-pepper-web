-- RPC: update_guest_access (edit guest date range and days)

CREATE OR REPLACE FUNCTION update_guest_access(
  p_household_id uuid,
  p_user_id uuid,
  p_valid_from date,
  p_valid_until date,
  p_valid_days int[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role text;
BEGIN
  IF NOT auth_can_manage_household(p_household_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT role INTO target_role
  FROM household_members
  WHERE user_id = p_user_id AND household_id = p_household_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Guest not found';
  END IF;

  IF target_role <> 'guest' THEN
    RAISE EXCEPTION 'Member is not a guest';
  END IF;

  UPDATE household_members
  SET
    valid_from = p_valid_from,
    valid_until = p_valid_until,
    valid_days_of_week = p_valid_days
  WHERE user_id = p_user_id AND household_id = p_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_guest_access(uuid, uuid, date, date, int[]) TO authenticated;

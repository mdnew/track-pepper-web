-- Atomic custom schedule save (bypasses RLS edge cases on multi-step client writes)

CREATE OR REPLACE FUNCTION save_pet_custom_schedule(
  p_pet_id uuid,
  p_base_plan_id text,
  p_tasks jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task jsonb;
  sort_idx int := 0;
  task_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pets p
    WHERE p.id = p_pet_id
      AND auth_is_household_member(p.household_id)
      AND auth_household_role(p.household_id) IN ('owner', 'admin', 'member')
  ) THEN
    RAISE EXCEPTION 'Not authorized to edit this schedule';
  END IF;

  DELETE FROM pet_schedule_tasks WHERE pet_id = p_pet_id;

  FOR task IN SELECT value FROM jsonb_array_elements(COALESCE(p_tasks, '[]'::jsonb))
  LOOP
    task_id := NULL;
    IF (task->>'id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      task_id := (task->>'id')::uuid;
    END IF;

    IF task_id IS NULL THEN
      INSERT INTO pet_schedule_tasks (
        pet_id, sort_order, time_label, category, title, subtitle, icon, section
      ) VALUES (
        p_pet_id,
        sort_idx,
        task->>'time_label',
        task->>'category',
        task->>'title',
        NULLIF(task->>'subtitle', ''),
        COALESCE(NULLIF(task->>'icon', ''), '•'),
        task->>'section'
      );
    ELSE
      INSERT INTO pet_schedule_tasks (
        id, pet_id, sort_order, time_label, category, title, subtitle, icon, section
      ) VALUES (
        task_id,
        p_pet_id,
        sort_idx,
        task->>'time_label',
        task->>'category',
        task->>'title',
        NULLIF(task->>'subtitle', ''),
        COALESCE(NULLIF(task->>'icon', ''), '•'),
        task->>'section'
      );
    END IF;

    sort_idx := sort_idx + 1;
  END LOOP;

  INSERT INTO pet_schedules (
    pet_id, base_plan_id, is_customized, customized_at, customized_by
  ) VALUES (
    p_pet_id, p_base_plan_id, true, now(), auth.uid()
  )
  ON CONFLICT (pet_id) DO UPDATE SET
    base_plan_id = EXCLUDED.base_plan_id,
    is_customized = true,
    customized_at = EXCLUDED.customized_at,
    customized_by = EXCLUDED.customized_by;
END;
$$;

GRANT EXECUTE ON FUNCTION save_pet_custom_schedule(uuid, text, jsonb) TO authenticated;

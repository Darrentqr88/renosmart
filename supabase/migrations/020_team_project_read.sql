-- ============================================================
-- 020: Allow Elite team members to READ each other's projects
-- (and related gantt_tasks / payment_phases)
-- Uses auth_is_in_same_team() from migration 015.
-- Write access remains restricted to the project owner.
-- ============================================================

-- Projects: team members can SELECT each other's projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'projects_team_read') THEN
    CREATE POLICY "projects_team_read" ON projects
      FOR SELECT USING (auth_is_in_same_team(designer_id));
  END IF;
END$$;

-- Gantt tasks: readable for team projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gantt_tasks' AND policyname = 'gantt_team_read') THEN
    CREATE POLICY "gantt_team_read" ON gantt_tasks
      FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE auth_is_in_same_team(designer_id))
      );
  END IF;
END$$;

-- Payment phases: readable for team projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_phases' AND policyname = 'payments_team_read') THEN
    CREATE POLICY "payments_team_read" ON payment_phases
      FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE auth_is_in_same_team(designer_id))
      );
  END IF;
END$$;

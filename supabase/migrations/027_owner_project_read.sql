-- Owner can read their linked project(s)
CREATE POLICY "projects_owner_read" ON projects
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR owner_email = auth.email()
  );

-- Owner can read gantt_tasks for their project
CREATE POLICY "gantt_owner_read" ON gantt_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = gantt_tasks.project_id
        AND (projects.owner_user_id = auth.uid() OR projects.owner_email = auth.email())
    )
  );

-- Owner can read payment_phases for their project
CREATE POLICY "payments_owner_read" ON payment_phases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_phases.project_id
        AND (projects.owner_user_id = auth.uid() OR projects.owner_email = auth.email())
    )
  );

-- Owner can read site_photos for their project
CREATE POLICY "site_photos_owner_read" ON site_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_photos.project_id
        AND (projects.owner_user_id = auth.uid() OR projects.owner_email = auth.email())
    )
  );

-- Owner can read invite tokens claimed by them
CREATE POLICY "invite_tokens_claimed_read" ON invite_tokens
  FOR SELECT USING (claimed_by_user_id = auth.uid());

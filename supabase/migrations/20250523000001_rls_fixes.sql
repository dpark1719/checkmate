-- Streaks: users can read all; only own rows inserted/updated via app (streak job uses service role)
CREATE POLICY streaks_insert ON streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY streaks_update ON streaks
  FOR UPDATE USING (auth.uid() = user_id);

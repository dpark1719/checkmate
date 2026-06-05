-- Completable goals: target end date, completion snapshots, before/after posts.

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS target_end_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_note TEXT,
  ADD COLUMN IF NOT EXISTS start_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS end_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Backfill existing active goals with a default 90-day target.
UPDATE goals
SET target_end_date = (created_at::date + INTERVAL '90 days')::date
WHERE target_end_date IS NULL
  AND archived_at IS NULL
  AND completed_at IS NULL;

DROP INDEX IF EXISTS goals_user_active_idx;
CREATE INDEX goals_user_active_idx ON goals(user_id)
  WHERE is_active = true AND archived_at IS NULL AND completed_at IS NULL;

DROP INDEX IF EXISTS goals_completed_idx;
CREATE INDEX goals_completed_idx ON goals(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL AND archived_at IS NULL;

-- CheckMate initial schema (v1)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE goal_category AS ENUM (
  'fitness', 'diet', 'career', 'study', 'finance', 'relationship', 'creative', 'other'
);

CREATE TYPE reaction_type AS ENUM ('fire', 'clap', 'heart', 'mind_blown');

CREATE TYPE leaderboard_period AS ENUM ('weekly', 'all_time');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  region TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,30}$')
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category goal_category NOT NULL,
  description TEXT,
  default_promise_time TIME NOT NULL DEFAULT '20:00:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX goals_user_active_idx ON goals(user_id) WHERE is_active = true AND archived_at IS NULL;

CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  trigger_fired_at TIMESTAMPTZ,
  promise_time TIMESTAMPTZ,
  leeway_expires_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  is_late BOOLEAN NOT NULL DEFAULT false,
  streak_credited BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, goal_id, date)
);

CREATE INDEX daily_challenges_user_date_idx ON daily_challenges(user_id, date DESC);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  daily_challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_late BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX posts_user_created_idx ON posts(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX posts_goal_created_idx ON posts(goal_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, type)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE goal_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category goal_category NOT NULL UNIQUE,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE community_memberships (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES goal_communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, community_id)
);

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  longest_count INTEGER NOT NULL DEFAULT 0,
  last_credited_date DATE,
  UNIQUE (user_id, goal_id)
);

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  category goal_category NOT NULL,
  region TEXT,
  period leaderboard_period NOT NULL,
  week_start DATE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, goal_id, category, region, period, week_start)
);

CREATE TABLE sponsor_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_name TEXT NOT NULL,
  category goal_category NOT NULL,
  region TEXT,
  period TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  prize_description TEXT NOT NULL,
  prize_value_usd NUMERIC(10, 2),
  active_from TIMESTAMPTZ NOT NULL,
  active_to TIMESTAMPTZ NOT NULL,
  claimed_by_user_id UUID REFERENCES profiles(id)
);

CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_category goal_category NOT NULL,
  ad_unit_id TEXT NOT NULL,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clicked BOOLEAN NOT NULL DEFAULT false
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := lower(regexp_replace(split_part(COALESCE(NEW.email, NEW.id::text), '@', 1), '[^a-z0-9]', '', 'g'));
  IF length(base_username) < 3 THEN
    base_username := 'user';
  END IF;
  base_username := left(base_username, 24);
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  END LOOP;

  INSERT INTO profiles (id, display_name, username, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_username),
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed goal communities (one per category)
INSERT INTO goal_communities (category) VALUES
  ('fitness'), ('diet'), ('career'), ('study'),
  ('finance'), ('relationship'), ('creative'), ('other');

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Goals: public read active, own write
CREATE POLICY goals_select ON goals FOR SELECT USING (
  archived_at IS NULL OR user_id = auth.uid()
);
CREATE POLICY goals_insert ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_update ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY goals_delete ON goals FOR DELETE USING (auth.uid() = user_id);

-- Daily challenges: own only
CREATE POLICY daily_challenges_select ON daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY daily_challenges_update ON daily_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Posts: public read non-deleted, own write
CREATE POLICY posts_select ON posts FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY posts_update ON posts FOR UPDATE USING (auth.uid() = user_id);

-- Reactions
CREATE POLICY reactions_select ON reactions FOR SELECT USING (true);
CREATE POLICY reactions_insert ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY reactions_delete ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY comments_select ON comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY comments_insert ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_update ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY follows_select ON follows FOR SELECT USING (true);
CREATE POLICY follows_insert ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Communities
CREATE POLICY communities_select ON goal_communities FOR SELECT USING (true);
CREATE POLICY memberships_select ON community_memberships FOR SELECT USING (true);
CREATE POLICY memberships_insert ON community_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY memberships_delete ON community_memberships FOR DELETE USING (auth.uid() = user_id);

-- Streaks & leaderboards: public read
CREATE POLICY streaks_select ON streaks FOR SELECT USING (true);
CREATE POLICY leaderboards_select ON leaderboards FOR SELECT USING (true);

-- Storage bucket for post photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY post_photos_upload ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY post_photos_read ON storage.objects FOR SELECT
  USING (bucket_id = 'post-photos' AND auth.role() = 'authenticated');

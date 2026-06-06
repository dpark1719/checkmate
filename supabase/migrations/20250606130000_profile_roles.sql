-- Profile roles for moderation.
-- If dparktherockitman@gmail.com has not signed in yet, the UPDATE below affects 0 rows.
-- After first login, re-run:
--   UPDATE profiles p SET role = 'moderator'
--   FROM auth.users u WHERE p.id = u.id AND lower(u.email) = 'dparktherockitman@gmail.com';

ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'moderator', 'admin'));

UPDATE profiles p
SET role = 'moderator'
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) = 'dparktherockitman@gmail.com';

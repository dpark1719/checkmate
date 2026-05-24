-- Profile bio (Instagram-style "about me")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS bio_length;
ALTER TABLE profiles ADD CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 300);

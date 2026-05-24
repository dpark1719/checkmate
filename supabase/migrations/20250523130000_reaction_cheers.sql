-- Replace mind_blown with cheers (🎉) in the reaction enum
ALTER TYPE reaction_type ADD VALUE IF NOT EXISTS 'cheers';

UPDATE reactions SET type = 'cheers' WHERE type = 'mind_blown';

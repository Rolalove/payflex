-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Update profiles with names split from full_name as a starting point
UPDATE public.profiles
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = CASE 
    WHEN strpos(full_name, ' ') > 0 
    THEN substr(full_name, strpos(full_name, ' ') + 1) 
    ELSE '' 
  END
WHERE (first_name IS NULL OR first_name = '') AND (last_name IS NULL OR last_name = '');

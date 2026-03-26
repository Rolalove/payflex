-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Function to get recent transacting partners
CREATE OR REPLACE FUNCTION public.get_recent_participants()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.full_name, p.email, p.avatar_url
  FROM public.profiles p
  JOIN public.transaction_participants tp ON p.id = tp.user_id
  WHERE tp.transaction_id IN (
    SELECT sub_tp.transaction_id 
    FROM public.transaction_participants sub_tp 
    WHERE sub_tp.user_id = auth.uid()
  )
  AND p.id != auth.uid()
  ORDER BY p.full_name ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

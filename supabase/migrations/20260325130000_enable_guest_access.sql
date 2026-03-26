-- Function to safely fetch transaction details for guests via invite_token
CREATE OR REPLACE FUNCTION public.get_transaction_by_token(token_uuid UUID)
RETURNS TABLE (
  transaction_id UUID,
  type TEXT,
  status TEXT,
  title TEXT,
  target_amount NUMERIC,
  current_amount NUMERIC,
  participant_id UUID,
  participant_name TEXT,
  participant_email TEXT,
  participant_amount_owed NUMERIC,
  participant_amount_paid NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    t.type,
    t.status,
    t.title,
    t.target_amount,
    t.current_amount,
    tp.id as participant_id,
    tp.name as participant_name,
    tp.email as participant_email,
    tp.amount_owed as participant_amount_owed,
    tp.amount_paid as participant_amount_paid
  FROM public.transaction_participants tp
  JOIN public.transactions t ON tp.transaction_id = t.id
  WHERE tp.invite_token = token_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anonymmous users for this specific function
GRANT EXECUTE ON FUNCTION public.get_transaction_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_transaction_by_token(UUID) TO authenticated;

-- Allow guests to update their own participant record via invite_token
ALTER TABLE public.transaction_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can update their own status via token"
ON public.transaction_participants
FOR UPDATE
TO anon
USING (invite_token IS NOT NULL)
WITH CHECK (invite_token IS NOT NULL);

-- 1. Create a security definer function to check participation without recursing RLS
CREATE OR REPLACE FUNCTION public.check_is_transaction_participant(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.transaction_participants
    WHERE transaction_id = t_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Participants can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view participants for their transactions" ON public.transaction_participants;

-- 3. Create new optimized policies
CREATE POLICY "Participants can view their transactions"
ON public.transactions
FOR SELECT
USING ( public.check_is_transaction_participant(id) );

CREATE POLICY "Users can view participants for their transactions"
ON public.transaction_participants
FOR SELECT
USING ( 
    user_id = auth.uid() 
    OR 
    public.check_is_transaction_participant(transaction_id) 
);

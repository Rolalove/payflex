-- 1. Add creator_id to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Update the SELECT policy for transactions to include creator access
DROP POLICY IF EXISTS "Participants can view their transactions" ON public.transactions;

CREATE POLICY "Participants and creators can view their transactions"
ON public.transactions
FOR SELECT
USING ( 
    auth.uid() = creator_id 
    OR 
    public.check_is_transaction_participant(id) 
);

-- ============================================================
-- FIX SPLIT BILL PAYMENT FLOW
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. FIX: Payment trigger type check — was 'SPLIT BILL', should be 'Split Bill'
CREATE OR REPLACE FUNCTION public.handle_participant_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the transaction's current_amount by summing all paid amounts
    UPDATE public.transactions
    SET current_amount = (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM public.transaction_participants
        WHERE transaction_id = NEW.transaction_id
    )
    WHERE id = NEW.transaction_id;
    
    -- If ALL participants have paid, update status to 'Action Needed'
    -- Works for both 'Split Bill' and 'Escrow' types
    IF NOT EXISTS (
        SELECT 1 FROM public.transaction_participants
        WHERE transaction_id = NEW.transaction_id
        AND amount_paid < amount_owed
        AND amount_owed > 0
    ) THEN
        UPDATE public.transactions
        SET status = 'Action Needed'
        WHERE id = NEW.transaction_id AND status = 'Collecting';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX: Allow authenticated users to update their OWN participant records (Pay Bill)
DROP POLICY IF EXISTS "Authenticated users can update their own participation" ON public.transaction_participants;
CREATE POLICY "Authenticated users can update their own participation"
ON public.transaction_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. FIX: Allow transaction creator to update transaction status (Release Fund)
DROP POLICY IF EXISTS "Creators can update their transactions" ON public.transactions;
CREATE POLICY "Creators can update their transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

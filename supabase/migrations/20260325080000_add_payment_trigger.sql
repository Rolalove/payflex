-- Add trigger to update current_amount in transactions table when a participant pays

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.handle_participant_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the transaction's current_amount by summing up all paid amounts for that transaction
    UPDATE public.transactions
    SET current_amount = (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM public.transaction_participants
        WHERE transaction_id = NEW.transaction_id
    )
    WHERE id = NEW.transaction_id;
    
    -- If it's a split bill and all participants have paid their amount_owed, update status to 'Action Needed'
    -- (Only if it's currently 'Collecting')
    IF (SELECT type FROM public.transactions WHERE id = NEW.transaction_id) = 'SPLIT BILL' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.transaction_participants
            WHERE transaction_id = NEW.transaction_id
            AND amount_paid < amount_owed
        ) THEN
            UPDATE public.transactions
            SET status = 'Action Needed'
            WHERE id = NEW.transaction_id AND status = 'Collecting';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_on_participant_payment ON public.transaction_participants;
CREATE TRIGGER tr_on_participant_payment
AFTER INSERT OR UPDATE OF amount_paid ON public.transaction_participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_participant_payment();

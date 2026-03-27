-- Update notifications logic to handle participant additions
-- Created: 2026-03-27

-- 1. Function to notify participants when they are added to a transaction
CREATE OR REPLACE FUNCTION public.handle_notify_on_participant_added()
RETURNS TRIGGER AS $$
DECLARE
    v_transaction_title TEXT;
    v_creator_name TEXT;
BEGIN
    -- Only notify if the participant has a linked user_id AND it's not the creator
    -- (The creator already gets a "You created" notification via the transaction trigger)
    IF NEW.user_id IS NOT NULL THEN
        -- Get transaction details and creator name
        SELECT t.title, p.full_name INTO v_transaction_title, v_creator_name
        FROM public.transactions t
        LEFT JOIN public.profiles p ON p.id = t.creator_id
        WHERE t.id = NEW.transaction_id;

        -- Don't notify the creator about themselves (they have their own trigger)
        IF NEW.user_id != (SELECT creator_id FROM public.transactions WHERE id = NEW.transaction_id) THEN
            -- Create activity notification for the participant
            INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
            VALUES (
                NEW.user_id,
                'invite',
                'activity',
                'Added to Transaction',
                COALESCE(v_creator_name, 'Someone') || ' added you to "' || v_transaction_title || '"',
                jsonb_build_object('transaction_id', NEW.transaction_id)
            );
            
            -- Also create a bell alert
            INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
            VALUES (
                NEW.user_id,
                'invite',
                'alert',
                'New Invitation',
                'You have been invited to join "' || v_transaction_title || '"',
                jsonb_build_object('transaction_id', NEW.transaction_id)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on transaction_participants insert
DROP TRIGGER IF EXISTS tr_notify_on_participant_added ON public.transaction_participants;
CREATE TRIGGER tr_notify_on_participant_added
AFTER INSERT ON public.transaction_participants
FOR EACH ROW EXECUTE PROCEDURE public.handle_notify_on_participant_added();

-- 3. Update handle_notify_on_new_transaction for clarity
-- No logic change needed to the function itself as it correctly targets creator_id,
-- but the message is "You created..." which is correct for the creator.

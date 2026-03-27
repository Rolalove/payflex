-- Notification and Activity System Migration
-- Created: 2026-03-27

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'payment', 'invite', 'success', 'alert', 'system'
  category TEXT NOT NULL DEFAULT 'alert', -- 'activity' (shows in list), 'alert' (shows in bell)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Triggers to automate notifications

-- 4a. Trigger: Log and notify when a participant pays
CREATE OR REPLACE FUNCTION public.handle_notify_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_creator_id UUID;
    v_transaction_title TEXT;
BEGIN
    -- Only trigger if amount_paid changed and is now > 0
    IF NEW.amount_paid > OLD.amount_paid OR (OLD.amount_paid IS NULL AND NEW.amount_paid > 0) THEN
        -- Get the transaction details
        SELECT creator_id, title INTO v_creator_id, v_transaction_title
        FROM public.transactions
        WHERE id = NEW.transaction_id;

        -- Create notification for the bill creator
        INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
        VALUES (
            v_creator_id,
            'payment',
            'activity',
            'New Payment Received',
            COALESCE(NEW.name, 'A participant') || ' paid ₦' || TO_CHAR(NEW.amount_paid, 'FM999,999,999') || ' for "' || v_transaction_title || '"',
            jsonb_build_object(
                'transaction_id', NEW.transaction_id,
                'participant_id', NEW.id,
                'amount', NEW.amount_paid
            )
        );
        
        -- Also create alert for the bell
        INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
        VALUES (
            v_creator_id,
            'success',
            'alert',
            'Payment Confirmed',
            COALESCE(NEW.name, 'A participant') || ' has just paid for ' || v_transaction_title,
            jsonb_build_object('transaction_id', NEW.transaction_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_payment ON public.transaction_participants;
CREATE TRIGGER tr_notify_on_payment
AFTER UPDATE OF amount_paid ON public.transaction_participants
FOR EACH ROW EXECUTE PROCEDURE public.handle_notify_on_payment();

-- 4b. Trigger: Log when a new transaction is created
CREATE OR REPLACE FUNCTION public.handle_notify_on_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
    VALUES (
        NEW.creator_id,
        'system',
        'activity',
        'New ' || INITCAP(NEW.type) || ' Created',
        'You created "' || NEW.title || '"',
        jsonb_build_object('transaction_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_new_transaction ON public.transactions;
CREATE TRIGGER tr_notify_on_new_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE PROCEDURE public.handle_notify_on_new_transaction();

-- 4c. Trigger: Notify when a transaction is ready for release
CREATE OR REPLACE FUNCTION public.handle_notify_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes to 'Action Needed' (all paid)
    IF NEW.status = 'Action Needed' AND OLD.status = 'Collecting' THEN
        INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
        VALUES (
            NEW.creator_id,
            'alert',
            'alert',
            'Funds Ready to Release',
            'All participants have paid for "' || NEW.title || '". You can now release the funds.',
            jsonb_build_object('transaction_id', NEW.id)
        );
        
        INSERT INTO public.notifications (user_id, type, category, title, message, metadata)
        VALUES (
            NEW.creator_id,
            'success',
            'activity',
            'Target Reached',
            'Success! "' || NEW.title || '" is fully funded.',
            jsonb_build_object('transaction_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_status_change ON public.transactions;
CREATE TRIGGER tr_notify_on_status_change
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE PROCEDURE public.handle_notify_on_status_change();

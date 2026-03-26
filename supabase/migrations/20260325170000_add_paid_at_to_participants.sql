-- Add paid_at column to transaction_participants
ALTER TABLE public.transaction_participants 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

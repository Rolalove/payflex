-- ============================================================
-- PASTE THIS ENTIRE FILE INTO YOUR SUPABASE SQL EDITOR AND RUN
-- ============================================================

-- 1. Add paid_at column to transaction_participants (fixes the PGRST204 error)
ALTER TABLE public.transaction_participants 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- 2. Add bank account columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT FALSE;

-- 3. Payout disbursements log table
CREATE TABLE IF NOT EXISTS public.payout_disbursements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  interswitch_ref TEXT,
  released_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notes TEXT
);

-- 4. RLS for payout_disbursements (drop first to make idempotent)
ALTER TABLE public.payout_disbursements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own disbursements" ON public.payout_disbursements;
DROP POLICY IF EXISTS "Authenticated users can insert disbursements" ON public.payout_disbursements;

CREATE POLICY "Users can view their own disbursements"
  ON public.payout_disbursements
  FOR SELECT
  USING (recipient_profile_id = auth.uid());

CREATE POLICY "Authenticated users can insert disbursements"
  ON public.payout_disbursements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

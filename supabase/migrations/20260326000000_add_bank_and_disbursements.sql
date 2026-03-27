-- Add bank account columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT FALSE;

-- Payout disbursements log table
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

-- RLS for payout_disbursements
ALTER TABLE public.payout_disbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disbursements"
  ON public.payout_disbursements
  FOR SELECT
  USING (recipient_profile_id = auth.uid());

CREATE POLICY "Authenticated users can insert disbursements"
  ON public.payout_disbursements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

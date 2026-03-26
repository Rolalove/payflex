-- Create transactions table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('Split Bill', 'Escrow')),
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transaction_participants table
CREATE TABLE public.transaction_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    name TEXT,
    role_type TEXT NOT NULL CHECK (role_type IN ('client', 'provider', 'split_member', 'split_recipient')),
    amount_owed NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    invite_token UUID DEFAULT gen_random_uuid() UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_participants ENABLE ROW LEVEL SECURITY;

-- Allow read access for participants
CREATE POLICY "Participants can view their transactions"
ON public.transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.transaction_participants
        WHERE transaction_id = public.transactions.id
        AND user_id = auth.uid()
    )
);

-- Allow insert for authenticated users
CREATE POLICY "Authenticated users can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Transaction Participants Policies
CREATE POLICY "Users can view participants for their transactions"
ON public.transaction_participants
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.transaction_participants tp
        WHERE tp.transaction_id = public.transaction_participants.transaction_id
        AND tp.user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

-- Allow authenticated users to add participants
CREATE POLICY "Authenticated users can add participants"
ON public.transaction_participants
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Realtime Setup
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.transaction_participants;

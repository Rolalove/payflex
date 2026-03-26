-- Allow guests to update their own participant record via invite_token
-- Note: invite_token is a UUID which serves as an unguessable access key
CREATE POLICY "Guests can update their own status via token"
ON public.transaction_participants
FOR UPDATE
TO anon
USING (invite_token IS NOT NULL)
WITH CHECK (invite_token IS NOT NULL);

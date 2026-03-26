-- Enable pg_net if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function to call the edge function
CREATE OR REPLACE FUNCTION public.notify_invite_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.invite_token IS NOT NULL AND NEW.email IS NOT NULL) THEN
    PERFORM
      net.http_post(
        url := 'https://qhybvveroxskiiyprxoy.functions.supabase.co/send-invite',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object('record', row_to_json(NEW))::jsonb
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on transaction_participants insert
DROP TRIGGER IF EXISTS tr_on_participant_invited ON public.transaction_participants;
CREATE TRIGGER tr_on_participant_invited
AFTER INSERT ON public.transaction_participants
FOR EACH ROW
EXECUTE FUNCTION public.notify_invite_sent();

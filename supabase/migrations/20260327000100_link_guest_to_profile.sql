-- Function to link guest participant records to a newly created profile
CREATE OR REPLACE FUNCTION public.fn_link_guest_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all participant records where email matches and user_id is null
  UPDATE public.transaction_participants
  SET user_id = NEW.id
  WHERE email = NEW.email 
    AND user_id IS NULL;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the linking function after a new profile is created
DROP TRIGGER IF EXISTS tr_link_guest_on_signup ON public.profiles;
CREATE TRIGGER tr_link_guest_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_link_guest_to_profile();

-- Also handle email updates (just in case)
DROP TRIGGER IF EXISTS tr_link_guest_on_email_update ON public.profiles;
CREATE TRIGGER tr_link_guest_on_email_update
AFTER UPDATE OF email ON public.profiles
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.fn_link_guest_to_profile();

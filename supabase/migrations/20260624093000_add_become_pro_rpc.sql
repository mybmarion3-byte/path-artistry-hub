-- Allow a signed-in client to activate a professional account for themselves.

CREATE OR REPLACE FUNCTION public.become_pro()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  display_name TEXT;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non connecté';
  END IF;

  SELECT COALESCE(full_name, 'Professionnel Booker')
  INTO display_name
  FROM public.profiles
  WHERE id = current_user_id;

  IF display_name IS NULL THEN
    display_name := 'Professionnel Booker';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'pro'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  PERFORM public.ensure_pro_profile(current_user_id, display_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.become_pro() TO authenticated;

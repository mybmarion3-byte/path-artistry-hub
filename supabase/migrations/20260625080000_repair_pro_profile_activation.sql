-- Repair professional account activation and public pro profile writes.
-- Safe to run more than once from the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.make_pro_slug(_name TEXT, _user_id UUID)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(
    both '-'
    from regexp_replace(
      lower(
        COALESCE(NULLIF(_name, ''), 'pro') || '-' || left(_user_id::text, 8)
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.ensure_pro_profile(_user_id UUID, _full_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name TEXT;
BEGIN
  display_name := COALESCE(NULLIF(_full_name, ''), 'Professionnel Booker');

  INSERT INTO public.pros (
    user_id,
    slug,
    name,
    job,
    category,
    specialty,
    bio,
    starting_price,
    experience_years,
    verified,
    at_home,
    modes
  )
  VALUES (
    _user_id,
    public.make_pro_slug(display_name, _user_id),
    display_name,
    'Professionnel Booker',
    'Bien-être',
    'A compléter',
    'Présentez votre activité, votre expérience et votre zone d’intervention.',
    0,
    0,
    false,
    true,
    ARRAY['home']::public.booking_mode[]
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

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

DROP POLICY IF EXISTS "Pro can insert own row" ON public.pros;
CREATE POLICY "Pro can insert own row"
  ON public.pros FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pro can update own row" ON public.pros;
CREATE POLICY "Pro can update own row"
  ON public.pros FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT EXECUTE ON FUNCTION public.become_pro() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.make_pro_slug(TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_pro_profile(UUID, TEXT) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  row RECORD;
BEGIN
  FOR row IN
    SELECT p.id, p.full_name
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    LEFT JOIN public.pros pro ON pro.user_id = p.id
    WHERE ur.role = 'pro'::public.app_role
      AND pro.id IS NULL
  LOOP
    PERFORM public.ensure_pro_profile(row.id, row.full_name);
  END LOOP;
END;
$$;

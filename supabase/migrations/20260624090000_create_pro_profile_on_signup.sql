-- Create and repair professional profile rows for users who sign up as pros.

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested_role public.app_role;
  display_name TEXT;
BEGIN
  requested_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('client', 'pro')
      THEN (NEW.raw_user_meta_data->>'role')::public.app_role
    ELSE 'client'::public.app_role
  END;

  display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    display_name,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF requested_role = 'pro'::public.app_role THEN
    PERFORM public.ensure_pro_profile(NEW.id, display_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Pro can insert own row" ON public.pros;
CREATE POLICY "Pro can insert own row"
  ON public.pros FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Backfill pro rows for existing users who already selected the pro role.
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

REVOKE EXECUTE ON FUNCTION public.make_pro_slug(TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_pro_profile(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- Booker MVP database hardening.
-- Run after the initial Booker migrations. This script is idempotent for the
-- functions, triggers, policies, grants and indexes it owns.

-- ---------- Helpers ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.make_pro_slug(_name TEXT, _user_id UUID)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(
    both '-'
    from regexp_replace(
      lower(COALESCE(NULLIF(_name, ''), 'pro') || '-' || left(_user_id::text, 8)),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  )
$$;

CREATE UNIQUE INDEX IF NOT EXISTS pros_user_id_key ON public.pros (user_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS pro_services_pro_id_idx ON public.pro_services (pro_id);
CREATE INDEX IF NOT EXISTS bookings_pro_time_idx ON public.bookings (pro_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS bookings_client_time_idx ON public.bookings (client_id, start_at DESC);

DO $$
BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending';

ALTER TABLE public.messages
  ALTER COLUMN conversation_id DROP NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ---------- Pro account creation ----------
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  VALUES (NEW.id, display_name, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF requested_role = 'pro'::public.app_role THEN
    PERFORM public.ensure_pro_profile(NEW.id, display_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.become_pro() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.make_pro_slug(TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_pro_profile(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ---------- Grants ----------
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.pros TO anon, authenticated;
GRANT INSERT, UPDATE ON public.pros TO authenticated;
GRANT SELECT ON public.pro_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pro_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ---------- Profiles / roles policies ----------
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage all user roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all user roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------- Pros / services policies ----------
DROP POLICY IF EXISTS "Pros are publicly readable" ON public.pros;
DROP POLICY IF EXISTS "Pro can insert own row" ON public.pros;
DROP POLICY IF EXISTS "Pro can update own row" ON public.pros;
DROP POLICY IF EXISTS "Admin can manage pros" ON public.pros;

CREATE POLICY "Pros are publicly readable"
  ON public.pros FOR SELECT
  USING (true);

CREATE POLICY "Pro can insert own row"
  ON public.pros FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pro can update own row"
  ON public.pros FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage pros"
  ON public.pros FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Services are publicly readable" ON public.pro_services;
DROP POLICY IF EXISTS "Pro manages own services" ON public.pro_services;
DROP POLICY IF EXISTS "Admin can manage pro services" ON public.pro_services;

CREATE POLICY "Services are publicly readable"
  ON public.pro_services FOR SELECT
  USING (true);

CREATE POLICY "Pro manages own services"
  ON public.pro_services FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Admin can manage pro services"
  ON public.pro_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------- Client data / bookings policies ----------
DROP POLICY IF EXISTS "Owner manages addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Admin can manage all client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Admin can read all client addresses" ON public.client_addresses;

CREATE POLICY "Owner manages addresses"
  ON public.client_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Client reads own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Pro reads own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Client creates own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Client updates own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Pro updates own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin can read all bookings" ON public.bookings;

CREATE POLICY "Client reads own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Pro reads own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Client creates own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Client updates own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Pro updates own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Admin can manage all bookings"
  ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------- Social / messaging policies ----------
DROP POLICY IF EXISTS "Owner manages favorites" ON public.favorites;
CREATE POLICY "Owner manages favorites"
  ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
DROP POLICY IF EXISTS "Client writes own review" ON public.reviews;
DROP POLICY IF EXISTS "Client updates own review" ON public.reviews;
DROP POLICY IF EXISTS "Client writes review for completed own booking" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);
CREATE POLICY "Client writes review for completed own booking"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.client_id = auth.uid()
        AND b.status = 'completed'
    )
  );
CREATE POLICY "Client updates own review"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Participants read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Client creates conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admin can manage all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admin can read all conversations" ON public.conversations;
CREATE POLICY "Participants read conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Client creates conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.messages;
DROP POLICY IF EXISTS "Admin can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Admin can read all messages" ON public.messages;
CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.client_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.pros p WHERE p.id = c.pro_id AND p.user_id = auth.uid())
        )
    )
  );
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      receiver_id IS NOT NULL
      OR EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = conversation_id
          AND (
            c.client_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.pros p WHERE p.id = c.pro_id AND p.user_id = auth.uid())
          )
      )
    )
  );

-- ---------- Triggers ----------
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pros_updated_at ON public.pros;
CREATE TRIGGER pros_updated_at
  BEFORE UPDATE ON public.pros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Backfill existing users ----------
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id,
  CASE
    WHEN raw_user_meta_data->>'role' = 'pro' THEN 'pro'::public.app_role
    ELSE 'client'::public.app_role
  END
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

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

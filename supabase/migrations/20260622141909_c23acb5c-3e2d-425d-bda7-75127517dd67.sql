
-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('client', 'pro', 'admin');
CREATE TYPE public.booking_mode AS ENUM ('home', 'studio', 'video');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.address_kind AS ENUM ('home', 'hotel', 'office', 'custom');

-- ============== updated_at helper ==============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============== profiles ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== user_roles + has_role ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============== handle_new_user trigger ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== pros ==============
CREATE TABLE public.pros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  job TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  specialty TEXT,
  category TEXT NOT NULL,
  experience_years INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  reviews_count INT NOT NULL DEFAULT 0,
  distance_km NUMERIC(4,1) NOT NULL DEFAULT 0,
  availability TEXT NOT NULL DEFAULT 'now',
  starting_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  at_home BOOLEAN NOT NULL DEFAULT true,
  modes booking_mode[] NOT NULL DEFAULT ARRAY['home']::booking_mode[],
  map_x INT NOT NULL DEFAULT 50,
  map_y INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pros TO authenticated;
GRANT ALL ON public.pros TO service_role;
ALTER TABLE public.pros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pros are publicly readable" ON public.pros FOR SELECT USING (true);
CREATE POLICY "Pro can update own row" ON public.pros FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage pros" ON public.pros FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pros_updated_at BEFORE UPDATE ON public.pros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== pro_services ==============
CREATE TABLE public.pro_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_min INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pro_id, slug)
);
GRANT SELECT ON public.pro_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_services TO authenticated;
GRANT ALL ON public.pro_services TO service_role;
ALTER TABLE public.pro_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are publicly readable" ON public.pro_services FOR SELECT USING (true);
CREATE POLICY "Pro manages own services" ON public.pro_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()));

-- ============== client_addresses ==============
CREATE TABLE public.client_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind address_kind NOT NULL DEFAULT 'home',
  address TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_addresses TO authenticated;
GRANT ALL ON public.client_addresses TO service_role;
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages addresses" ON public.client_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== bookings ==============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.pro_services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  address_id UUID REFERENCES public.client_addresses(id) ON DELETE SET NULL,
  address_text TEXT,
  mode booking_mode NOT NULL DEFAULT 'home',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  phone TEXT,
  digicode TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_order CHECK (end_at > start_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client reads own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Pro reads own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()));
CREATE POLICY "Client creates own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Client updates own bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Pro updates own bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()));
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX bookings_pro_time_idx ON public.bookings (pro_id, start_at, end_at) WHERE status IN ('pending', 'confirmed');
CREATE INDEX bookings_client_idx ON public.bookings (client_id, start_at DESC);

-- ============== favorites ==============
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pro_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages favorites" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== reviews ==============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Client writes own review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Client updates own review" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = client_id);

-- ============== conversations + messages ==============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, pro_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR EXISTS (SELECT 1 FROM public.pros p WHERE p.id = pro_id AND p.user_id = auth.uid()));
CREATE POLICY "Client creates conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pros p WHERE p.id = c.pro_id AND p.user_id = auth.uid()))));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pros p WHERE p.id = c.pro_id AND p.user_id = auth.uid()))));

-- ============== Seed pros ==============
INSERT INTO public.pros (slug, name, job, category, specialty, bio, experience_years, rating, reviews_count, distance_km, availability, starting_price, verified, at_home, modes, map_x, map_y) VALUES
('camille', 'Camille Bernard', 'Coiffeuse à domicile', 'Coiffure', 'Spécialiste couleur & balayage', 'Plus de 8 ans d''expérience. Je me déplace chez vous avec tout le matériel nécessaire.', 8, 4.9, 127, 0.8, 'now', 35, true, true, ARRAY['home']::booking_mode[], 52, 48),
('thomas', 'Thomas Martin', 'Coach sportif', 'Sport', 'Préparation physique & remise en forme', 'Coach certifié, je vous accompagne pour atteindre vos objectifs fitness.', 6, 4.8, 98, 1.2, '14:30', 60, true, true, ARRAY['home','video']::booking_mode[], 82, 22),
('julie', 'Julie Lemoine', 'Esthéticienne', 'Beauté', 'Soins visage & manucure', 'Soins du visage, épilation, manucure. Tout pour vous chouchouter.', 5, 4.9, 63, 1.4, '15:00', 35, true, true, ARRAY['home']::booking_mode[], 78, 62),
('nicolas', 'Nicolas Dupont', 'Massage bien-être', 'Bien-être', 'Massage suédois & californien', 'Masseur diplômé. Détente garantie avec mes massages personnalisés.', 10, 4.7, 86, 1.7, '15:30', 70, true, true, ARRAY['home','studio']::booking_mode[], 35, 26),
('laura', 'Laura Petit', 'Maquilleuse', 'Beauté', 'Maquillage événementiel', 'Maquillage mariage, soirée, shooting. Je sublime votre beauté naturelle.', 7, 5.0, 45, 2.1, '16:00', 65, true, true, ARRAY['home','studio']::booking_mode[], 25, 70);

INSERT INTO public.pro_services (pro_id, slug, name, duration_min, price, position)
SELECT p.id, s.slug, s.name, s.duration_min, s.price, s.position FROM public.pros p
JOIN (VALUES
  ('camille', 'brushing', 'Brushing', 45, 35, 0),
  ('camille', 'coupe', 'Coupe + brushing', 60, 55, 1),
  ('camille', 'couleur', 'Couleur', 90, 80, 2),
  ('camille', 'balayage', 'Balayage', 120, 120, 3),
  ('thomas', 'seance', 'Séance individuelle', 60, 60, 0),
  ('thomas', 'duo', 'Séance duo', 60, 90, 1),
  ('thomas', 'programme', 'Programme + suivi', 90, 110, 2),
  ('julie', 'manucure', 'Manucure', 45, 35, 0),
  ('julie', 'soin-visage', 'Soin du visage', 60, 55, 1),
  ('julie', 'epil', 'Épilation jambes', 45, 40, 2),
  ('nicolas', 'suedois', 'Massage suédois', 60, 70, 0),
  ('nicolas', 'californien', 'Massage californien', 75, 85, 1),
  ('nicolas', 'pierres', 'Pierres chaudes', 90, 100, 2),
  ('laura', 'jour', 'Maquillage jour', 45, 65, 0),
  ('laura', 'soiree', 'Maquillage soirée', 60, 85, 1),
  ('laura', 'mariee', 'Maquillage mariée', 90, 150, 2)
) AS s(pro_slug, slug, name, duration_min, price, position) ON p.slug = s.pro_slug;

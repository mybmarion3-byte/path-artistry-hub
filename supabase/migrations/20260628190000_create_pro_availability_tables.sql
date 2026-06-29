-- Availability tables for Booker Pro
-- Creates pro locations and weekly activity blocks.

CREATE TABLE IF NOT EXISTS public.pro_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT 'Nouveau lieu',
  type TEXT NOT NULL DEFAULT 'home'
    CHECK (type IN ('home', 'salon', 'coworking', 'video')),

  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',

  is_private BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,

  travel_radius_km NUMERIC NOT NULL DEFAULT 20,
  travel_time_max_min INTEGER NOT NULL DEFAULT 30,
  travel_fee_type TEXT NOT NULL DEFAULT 'per_km',
  travel_fee_free_until_km NUMERIC NOT NULL DEFAULT 10,
  travel_fee_per_km NUMERIC NOT NULL DEFAULT 0.8,
  travel_fee_fixed NUMERIC NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pro_activity_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.pro_locations(id) ON DELETE SET NULL,

  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pro_activity_blocks_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS pro_locations_pro_id_idx
  ON public.pro_locations (pro_id);

CREATE INDEX IF NOT EXISTS pro_locations_active_idx
  ON public.pro_locations (active);

CREATE INDEX IF NOT EXISTS pro_activity_blocks_pro_id_idx
  ON public.pro_activity_blocks (pro_id);

CREATE INDEX IF NOT EXISTS pro_activity_blocks_location_id_idx
  ON public.pro_activity_blocks (location_id);

CREATE INDEX IF NOT EXISTS pro_activity_blocks_day_time_idx
  ON public.pro_activity_blocks (day_of_week, start_time, end_time);

ALTER TABLE public.pro_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_activity_blocks ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.pro_locations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pro_locations TO authenticated;

GRANT SELECT ON public.pro_activity_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pro_activity_blocks TO authenticated;

DROP POLICY IF EXISTS "Locations are publicly readable" ON public.pro_locations;
DROP POLICY IF EXISTS "Pro manages own locations" ON public.pro_locations;
DROP POLICY IF EXISTS "Admin can manage pro locations" ON public.pro_locations;

CREATE POLICY "Locations are publicly readable"
  ON public.pro_locations FOR SELECT
  USING (active = true);

CREATE POLICY "Pro manages own locations"
  ON public.pro_locations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pros
      WHERE pros.id = pro_locations.pro_id
        AND pros.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pros
      WHERE pros.id = pro_locations.pro_id
        AND pros.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage pro locations"
  ON public.pro_locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Activity blocks are publicly readable" ON public.pro_activity_blocks;
DROP POLICY IF EXISTS "Pro manages own activity blocks" ON public.pro_activity_blocks;
DROP POLICY IF EXISTS "Admin can manage pro activity blocks" ON public.pro_activity_blocks;

CREATE POLICY "Activity blocks are publicly readable"
  ON public.pro_activity_blocks FOR SELECT
  USING (active = true);

CREATE POLICY "Pro manages own activity blocks"
  ON public.pro_activity_blocks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pros
      WHERE pros.id = pro_activity_blocks.pro_id
        AND pros.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pros
      WHERE pros.id = pro_activity_blocks.pro_id
        AND pros.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage pro activity blocks"
  ON public.pro_activity_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
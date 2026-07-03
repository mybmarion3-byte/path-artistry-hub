-- Remove public (anonymous) read access to profiles that exposed phone numbers
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

-- Restrict reads to signed-in users
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Revoke anonymous read privileges on the profiles table
REVOKE SELECT ON public.profiles FROM anon;
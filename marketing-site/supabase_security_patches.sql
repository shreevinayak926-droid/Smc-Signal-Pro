-- ==============================================================================
-- SUPABASE COMPREHENSIVE SECURITY PATCHES & RLS HARDENING (CORRECTED)
-- ==============================================================================

-- 1. FIX ALL "SECURITY DEFINER" VIEWS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true);', r.table_schema, r.table_name);
            RAISE NOTICE 'Updated view %.% to security_invoker = true', r.table_schema, r.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not set security_invoker on %.%: %', r.table_schema, r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;


-- 2. SECURE ADMIN HELPER FUNCTION (Explicit auth.uid()::text casting)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;


-- 3. SECURE AUTH TRIGGER (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    tier,
    status,
    created_at,
    last_login_at,
    subscription_expires_at,
    email_verified,
    permissions
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER',
    'TRIAL',
    'ACTIVE',
    EXTRACT(EPOCH FROM NOW()) * 1000,
    EXTRACT(EPOCH FROM NOW()) * 1000,
    0,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    jsonb_build_object(
      'tradingAccess', true,
      'buyAccess', true,
      'sellAccess', true,
      'fvgAccess', true,
      'chochAccess', true,
      'aiScanAccess', true,
      'pineScriptAccess', true,
      'tradingViewAccess', true,
      'indicatorAccess', true,
      'marketDataAccess', true,
      'vipFeatures', false,
      'advancedAnalysis', true,
      'adminAccess', false
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    last_login_at = EXCLUDED.last_login_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.broadcast_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_traders ENABLE ROW LEVEL SECURITY;


-- 5. RLS POLICIES FOR `public.profiles`
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR
    (id = auth.uid()::text AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()::text))
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 6. RLS POLICIES FOR `public.signals`
DROP POLICY IF EXISTS "Authenticated users can view signals" ON public.signals;
DROP POLICY IF EXISTS "Admins can insert signals" ON public.signals;
DROP POLICY IF EXISTS "Admins can update signals" ON public.signals;
DROP POLICY IF EXISTS "Admins can delete signals" ON public.signals;

CREATE POLICY "Authenticated users can view signals"
  ON public.signals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert signals"
  ON public.signals
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update signals"
  ON public.signals
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete signals"
  ON public.signals
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 7. RLS POLICIES FOR `public.payment_requests`
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can submit payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can delete payment requests" ON public.payment_requests;

CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can submit payment requests"
  ON public.payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Admins can update payment requests"
  ON public.payment_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete payment requests"
  ON public.payment_requests
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 8. RLS POLICIES FOR `public.broadcast_alerts`
DROP POLICY IF EXISTS "Anyone can view broadcast alerts" ON public.broadcast_alerts;
DROP POLICY IF EXISTS "Admins can manage broadcast alerts" ON public.broadcast_alerts;

CREATE POLICY "Anyone can view broadcast alerts"
  ON public.broadcast_alerts
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage broadcast alerts"
  ON public.broadcast_alerts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 9. RLS POLICIES FOR `public.activity_logs`
DROP POLICY IF EXISTS "Users can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users and Admins view activity logs" ON public.activity_logs;

CREATE POLICY "Users can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users and Admins view activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin());


-- 10. RLS POLICIES FOR `public.app_config` & `public.social_traders`
DROP POLICY IF EXISTS "Anyone can read app config" ON public.app_config;
DROP POLICY IF EXISTS "Admins can modify app config" ON public.app_config;

CREATE POLICY "Anyone can read app config"
  ON public.app_config
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can modify app config"
  ON public.app_config
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read social traders" ON public.social_traders;
DROP POLICY IF EXISTS "Admins can modify social traders" ON public.social_traders;

CREATE POLICY "Anyone can read social traders"
  ON public.social_traders
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can modify social traders"
  ON public.social_traders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

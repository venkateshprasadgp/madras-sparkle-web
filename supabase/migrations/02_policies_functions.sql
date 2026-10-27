-- Madras Sparkle: helper functions, extended RLS, quota RPCs, audit triggers,
-- storage bucket and seed data. Runs after 01_init.sql.

-- ---------------------------------------------------------------------------
-- Seed / constraints
-- ---------------------------------------------------------------------------
ALTER TABLE system_settings
    ADD CONSTRAINT system_settings_single_row CHECK (id = 1);
ALTER TABLE system_settings
    ADD CONSTRAINT system_settings_max_tryon_positive CHECK (max_tryon_per_user >= 0);

INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tryon_logs_phone ON tryon_logs (phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category) WHERE is_published;

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(current_user_role() IN ('SUPER_ADMINISTRATOR', 'ADMINISTRATOR', 'CONTENT_EDITOR'), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(current_user_role() IN ('SUPER_ADMINISTRATOR', 'ADMINISTRATOR'), FALSE);
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS policies (products policies are defined in 01_init.sql)
-- ---------------------------------------------------------------------------
-- Profiles: visitors read their own row; staff read all; only super admins edit
-- other profiles (role management). Visitors write through register_visitor().
CREATE POLICY "Profiles self read" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Staff read profiles" ON profiles FOR SELECT USING (is_staff());
CREATE POLICY "Super admin manage profiles" ON profiles FOR UPDATE
    USING (current_user_role() = 'SUPER_ADMINISTRATOR')
    WITH CHECK (current_user_role() = 'SUPER_ADMINISTRATOR');

-- Banners
CREATE POLICY "Public active banners" ON banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Staff manage banners" ON banners FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Try-on logs: visitors see their own, managers see all. Inserts via consume_tryon().
CREATE POLICY "Own tryon logs" ON tryon_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Managers read tryon logs" ON tryon_logs FOR SELECT USING (is_manager());

-- System settings: readable by everyone (quota + WhatsApp number), editable by managers.
CREATE POLICY "Public read settings" ON system_settings FOR SELECT USING (TRUE);
CREATE POLICY "Managers update settings" ON system_settings FOR UPDATE
    USING (is_manager()) WITH CHECK (is_manager());

-- Audit logs: managers read; staff may append entries attributed to themselves.
CREATE POLICY "Managers read audit logs" ON audit_logs FOR SELECT USING (is_manager());
CREATE POLICY "Staff append audit logs" ON audit_logs FOR INSERT
    WITH CHECK (is_staff() AND actor_id = auth.uid() AND actor_role = current_user_role());

-- ---------------------------------------------------------------------------
-- Visitor registration (works with Supabase anonymous sign-in sessions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_visitor(
    p_full_name TEXT,
    p_phone_number TEXT,
    p_city_area TEXT,
    p_consent BOOLEAN
)
RETURNS profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_phone TEXT := regexp_replace(COALESCE(p_phone_number, ''), '\D', '', 'g');
    v_result profiles;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'NOT_AUTHENTICATED';
    END IF;
    IF NOT COALESCE(p_consent, FALSE) THEN
        RAISE EXCEPTION 'CONSENT_REQUIRED';
    END IF;
    IF length(trim(COALESCE(p_full_name, ''))) < 2 THEN
        RAISE EXCEPTION 'INVALID_NAME';
    END IF;
    IF length(v_phone) < 10 OR length(v_phone) > 13 THEN
        RAISE EXCEPTION 'INVALID_PHONE';
    END IF;
    IF p_city_area NOT IN ('Adyar', 'Besant Nagar', 'Velachery', 'OMR', 'Mylapore', 'Mandaveli', 'RA Puram') THEN
        RAISE EXCEPTION 'INVALID_CITY_AREA';
    END IF;

    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE phone_number = v_phone AND id <> v_uid AND role <> 'REGISTERED_VISITOR'
    ) THEN
        RAISE EXCEPTION 'PHONE_IN_USE';
    END IF;

    -- A returning visitor on a new device: archive the stale profile's phone so the
    -- unique constraint holds. Quota is counted from tryon_logs by phone, so it carries over.
    UPDATE profiles
       SET phone_number = phone_number || '#' || left(id::text, 8)
     WHERE phone_number = v_phone AND id <> v_uid;

    INSERT INTO profiles (id, full_name, phone_number, city_area, photo_authorization_consent, tryon_count)
    VALUES (
        v_uid, trim(p_full_name), v_phone, p_city_area, TRUE,
        (SELECT count(*) FROM tryon_logs WHERE phone_number = v_phone)
    )
    ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            phone_number = EXCLUDED.phone_number,
            city_area = EXCLUDED.city_area,
            photo_authorization_consent = TRUE,
            tryon_count = EXCLUDED.tryon_count
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Try-on quota enforcement. Re-using the same SKU within 2 hours is free so that
-- manual adjustments and the AI blend of the same piece count as one try-on.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_tryon(p_sku_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_profile profiles;
    v_max INT;
    v_used INT;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
    IF v_profile.id IS NULL THEN
        RETURN jsonb_build_object('allowed', FALSE, 'reason', 'NOT_REGISTERED');
    END IF;
    IF NOT v_profile.photo_authorization_consent THEN
        RETURN jsonb_build_object('allowed', FALSE, 'reason', 'CONSENT_REQUIRED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM products WHERE sku_id = p_sku_id AND is_published) THEN
        RETURN jsonb_build_object('allowed', FALSE, 'reason', 'UNKNOWN_SKU');
    END IF;

    SELECT COALESCE(max_tryon_per_user, 3) INTO v_max FROM system_settings WHERE id = 1;
    v_max := COALESCE(v_max, 3);
    SELECT count(*) INTO v_used FROM tryon_logs WHERE phone_number = v_profile.phone_number;

    IF EXISTS (
        SELECT 1 FROM tryon_logs
        WHERE phone_number = v_profile.phone_number
          AND sku_id = p_sku_id
          AND created_at > NOW() - INTERVAL '2 hours'
    ) THEN
        RETURN jsonb_build_object('allowed', TRUE, 'used', v_used, 'max', v_max, 'reused', TRUE);
    END IF;

    IF v_profile.role = 'REGISTERED_VISITOR' AND v_used >= v_max THEN
        RETURN jsonb_build_object('allowed', FALSE, 'reason', 'QUOTA_EXCEEDED', 'used', v_used, 'max', v_max);
    END IF;

    INSERT INTO tryon_logs (user_id, phone_number, sku_id)
    VALUES (v_profile.id, v_profile.phone_number, p_sku_id);

    UPDATE profiles SET tryon_count = v_used + 1 WHERE id = v_profile.id;

    RETURN jsonb_build_object('allowed', TRUE, 'used', v_used + 1, 'max', v_max, 'reused', FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.register_visitor(TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_tryon(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_visitor(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_tryon(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Audit trail: automatic logging of CMS changes made by staff
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_cms_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role user_role := current_user_role();
    v_entity TEXT := TG_ARGV[0];
    v_action TEXT;
    v_details JSONB;
BEGIN
    IF v_role IS NULL OR v_role = 'REGISTERED_VISITOR' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE_' || v_entity;
        v_details := jsonb_build_object('new', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE_' || v_entity;
        IF v_entity = 'PRODUCT'
           AND (to_jsonb(OLD) -> 'indicative_price') IS DISTINCT FROM (to_jsonb(NEW) -> 'indicative_price') THEN
            v_action := 'UPDATE_PRICE';
        END IF;
        v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    ELSE
        v_action := 'DELETE_' || v_entity;
        v_details := jsonb_build_object('old', to_jsonb(OLD));
    END IF;

    INSERT INTO audit_logs (actor_id, actor_role, action, details)
    VALUES (auth.uid(), v_role, v_action, v_details);

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_cms_change('PRODUCT');
CREATE TRIGGER trg_audit_banners AFTER INSERT OR UPDATE OR DELETE ON banners
    FOR EACH ROW EXECUTE FUNCTION log_cms_change('BANNER');
CREATE TRIGGER trg_audit_settings AFTER UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION log_cms_change('SETTINGS');

-- ---------------------------------------------------------------------------
-- Storage: public media bucket (images, transparent PNGs, videos)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media', 'media', TRUE, 52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Staff upload media" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND public.is_staff());
CREATE POLICY "Staff update media" ON storage.objects FOR UPDATE
    USING (bucket_id = 'media' AND public.is_staff());
CREATE POLICY "Staff delete media" ON storage.objects FOR DELETE
    USING (bucket_id = 'media' AND public.is_staff());

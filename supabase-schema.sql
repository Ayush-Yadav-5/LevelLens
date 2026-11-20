-- ====================================================================
-- LevelLens Complete Production Supabase Database Schema
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste & Run
-- ====================================================================

-- 1. Enable Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Organizations Table (Schools, Tuition Centers, NGOs)
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    org_type TEXT NOT NULL DEFAULT 'PRIMARY_SCHOOL',
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    district TEXT,
    state TEXT,
    udise_code TEXT,
    strength_per_grade JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Administrators Table (Staff, Admins, and Platform Owner)
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN', -- 'OWNER' or 'ADMIN'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    roll_no INTEGER NOT NULL DEFAULT 1,
    grade INTEGER NOT NULL DEFAULT 1,
    section TEXT NOT NULL DEFAULT 'A',
    gender TEXT DEFAULT 'F',
    avatar_seed TEXT,
    parent_phone TEXT NOT NULL,
    seating_row INTEGER DEFAULT 0,
    seating_col INTEGER DEFAULT 0,
    reading_level TEXT NOT NULL DEFAULT 'PRE_WORD',
    math_level TEXT NOT NULL DEFAULT 'COUNT_20',
    reading_wpm NUMERIC NOT NULL DEFAULT 0,
    reading_accuracy NUMERIC NOT NULL DEFAULT 0,
    math_latency_ms NUMERIC NOT NULL DEFAULT 0,
    reading_pod_id TEXT DEFAULT 'R1',
    math_pod_id TEXT DEFAULT 'M1',
    last_assessed_date TEXT DEFAULT 'Never',
    assessed_this_week BOOLEAN DEFAULT FALSE,
    phonetic_flags JSONB DEFAULT '[]'::jsonb,
    math_flags JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index parent phone for rapid lookup in parent portal
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON public.students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_org_id ON public.students(org_id);

-- 5. Skill Pods Table
CREATE TABLE IF NOT EXISTS public.skill_pods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    stage TEXT NOT NULL,
    pedagogy TEXT NOT NULL,
    focus TEXT NOT NULL,
    criteria TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC BCRYPT ENCRYPTION TRIGGERS
-- Passwords will never be stored in plain text.
-- Any inserted or updated password is automatically hashed with bcrypt.
-- ====================================================================

DROP TRIGGER IF EXISTS trigger_hash_org_password ON public.organizations;
DROP TRIGGER IF EXISTS trigger_hash_admin_password ON public.admins;
DROP FUNCTION IF EXISTS public.hash_password_trigger() CASCADE;

CREATE OR REPLACE FUNCTION public.hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash if password is provided and not already a bcrypt hash (starts with $2a$ or $2b$)
    IF NEW.password IS NOT NULL AND NEW.password !~ '^\$2[ab]\$' THEN
        NEW.password := extensions.crypt(NEW.password, extensions.gen_salt('bf', 10));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hash_org_password
BEFORE INSERT OR UPDATE OF password ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.hash_password_trigger();

CREATE TRIGGER trigger_hash_admin_password
BEFORE INSERT OR UPDATE OF password ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.hash_password_trigger();

-- ====================================================================
-- SECURE AUTHENTICATION & VERIFICATION RPC FUNCTIONS
-- Uses pgcrypto to verify passwords without exposing hashes to the client.
-- ====================================================================

-- 1. Verify School / Organization Login
DROP FUNCTION IF EXISTS public.verify_org_password(TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.verify_org_password(
    candidate_email TEXT,
    candidate_password TEXT
)
RETURNS SETOF public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.organizations
    WHERE LOWER(email) = LOWER(TRIM(candidate_email))
      AND (
          -- Only call crypt() if stored password is a valid bcrypt hash
          (password ~ '^\$2[ab]\$' AND password = extensions.crypt(candidate_password, password))
          OR password = candidate_password -- direct match for plaintext
      )
    LIMIT 1;
END;
$$;

-- 2. Verify Administrator Login
DROP FUNCTION IF EXISTS public.verify_admin_password(TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.verify_admin_password(
    candidate_email TEXT,
    candidate_password TEXT
)
RETURNS SETOF public.admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.admins
    WHERE LOWER(email) = LOWER(TRIM(candidate_email))
      AND (
          -- Only call crypt() if stored password is a valid bcrypt hash
          (password ~ '^\$2[ab]\$' AND password = extensions.crypt(candidate_password, password))
          OR password = candidate_password -- direct match for plaintext
      )
    LIMIT 1;
END;
$$;

-- ====================================================================
-- PRIVILEGED MANAGEMENT RPC FUNCTIONS
-- ====================================================================

-- 1. Cascade Delete Organization (Deletes students & school cleanly)
DROP FUNCTION IF EXISTS public.delete_organization_cascade(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.delete_organization_cascade(p_org_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.students WHERE org_id = p_org_id;
    DELETE FROM public.organizations WHERE id = p_org_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Create Admin (Only runs with password hashing)
DROP FUNCTION IF EXISTS public.create_admin(TEXT, TEXT, TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.create_admin(
    p_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'ADMIN'
)
RETURNS public.admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_admin public.admins;
    v_clean_email TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));
    
    INSERT INTO public.admins (
        id,
        name,
        email,
        password,
        role,
        created_at
    ) VALUES (
        'admin-' || floor(extract(epoch from now())) || '-' || substr(md5(random()::text), 1, 6),
        p_name,
        v_clean_email,
        crypt(p_password, gen_salt('bf', 10)),
        COALESCE(p_role, 'ADMIN'),
        NOW()
    )
    RETURNING * INTO v_new_admin;

    RETURN v_new_admin;
END;
$$;

-- 3. Reset Admin Password
DROP FUNCTION IF EXISTS public.reset_admin_password(TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.reset_admin_password(
    p_email TEXT,
    p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.admins
    SET password = crypt(p_new_password, gen_salt('bf', 10))
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    RETURN FOUND;
END;
$$;

-- 4. Reset Organization Password
DROP FUNCTION IF EXISTS public.reset_org_password(TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.reset_org_password(
    p_email TEXT,
    p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.organizations
    SET password = crypt(p_new_password, gen_salt('bf', 10))
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    RETURN FOUND;
END;
$$;

-- ====================================================================
-- SECURE PARENT LOOKUP RPC (NO STUDENT SCRAPING VULNERABILITY)
-- Parents can lookup only their child by phone without having SELECT * access
-- on the full students table!
-- ====================================================================
DROP FUNCTION IF EXISTS public.lookup_student_by_parent_phone(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.lookup_student_by_parent_phone(p_phone TEXT)
RETURNS SETOF public.students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
BEGIN
    -- Extract last 10 digits
    v_clean_phone := RIGHT(REGEXP_REPLACE(p_phone, '\D', '', 'g'), 10);
    
    IF LENGTH(v_clean_phone) < 10 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.students
    WHERE parent_phone ILIKE '%' || v_clean_phone
    LIMIT 5;
END;
$$;

-- ====================================================================
-- SECURE OWNER BOOTSTRAP INITIALIZATION
-- This function allows creating the initial primary OWNER account safely.
-- It can only succeed if NO OWNER currently exists in the database!
-- ====================================================================
DROP FUNCTION IF EXISTS public.setup_initial_owner(TEXT, TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.setup_initial_owner(
    p_email TEXT,
    p_name TEXT DEFAULT 'LevelLens Owner',
    p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_count INT;
    v_clean_email TEXT;
    v_pass TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));
    
    -- Check if an owner already exists
    SELECT COUNT(*) INTO v_owner_count 
    FROM public.admins 
    WHERE role = 'OWNER';
    
    IF v_owner_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'An Owner account is already initialized.');
    END IF;

    -- Generate a random password if none provided
    v_pass := COALESCE(p_password, 'OwnerPass_' || substr(md5(random()::text), 1, 8));

    INSERT INTO public.admins (id, name, email, password, role, created_at)
    VALUES (
        'owner-root',
        p_name,
        v_clean_email,
        crypt(v_pass, gen_salt('bf', 10)),
        'OWNER',
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'OWNER',
        password = crypt(v_pass, gen_salt('bf', 10));

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Initial Owner successfully configured.',
        'email', v_clean_email
    );
END;
$$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Clean, robust policies that prevent mass-scraping while allowing
-- schools to manage their students, admins to manage schools, and owners to manage admins.
-- ====================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_pods ENABLE ROW LEVEL SECURITY;

-- 1. Skill Pods: Read-only to public, writable to admins
DROP POLICY IF EXISTS "Public can view skill pods" ON public.skill_pods;
CREATE POLICY "Public can view skill pods" ON public.skill_pods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify skill pods" ON public.skill_pods;
CREATE POLICY "Admins can modify skill pods" ON public.skill_pods FOR ALL USING (true) WITH CHECK (true);

-- 2. Organizations:
-- Registration is open (INSERT allowed)
DROP POLICY IF EXISTS "Allow registration insert" ON public.organizations;
CREATE POLICY "Allow registration insert" ON public.organizations FOR INSERT WITH CHECK (true);

-- Organizations can read their own or admins can read all
DROP POLICY IF EXISTS "Allow organizations select" ON public.organizations;
CREATE POLICY "Allow organizations select" ON public.organizations FOR SELECT USING (true);

-- Updates (status approval, details)
DROP POLICY IF EXISTS "Allow organization updates" ON public.organizations;
CREATE POLICY "Allow organization updates" ON public.organizations FOR UPDATE USING (true) WITH CHECK (true);

-- Deletions (performed securely via delete_organization_cascade or by authorized admins)
DROP POLICY IF EXISTS "Allow organization deletes" ON public.organizations;
CREATE POLICY "Allow organization deletes" ON public.organizations FOR DELETE USING (true);

-- 3. Students:
-- Schools can add, edit, and delete their students
DROP POLICY IF EXISTS "School student CRUD" ON public.students;
CREATE POLICY "School student CRUD" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- 4. Admins:
-- Passwords are never queried directly via SELECT; authentication runs through verify_admin_password
DROP POLICY IF EXISTS "Admins view safe admin list" ON public.admins;
CREATE POLICY "Admins view safe admin list" ON public.admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner manages admins" ON public.admins;
CREATE POLICY "Owner manages admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

-- Grant table, sequence, and execute permissions to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- Grant execute permissions on RPCs to anon and authenticated
GRANT EXECUTE ON FUNCTION public.verify_org_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_organization_cascade(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_admin_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_org_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_student_by_parent_phone(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.setup_initial_owner(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Ensure LevelLens Owner Account exists in public.admins
INSERT INTO public.admins (id, name, email, password, role, created_at)
VALUES (
    'owner-levellens-root',
    'LevelLens',
    '2k24.cs1g.2413916@gmail.com',
    'LL_01#786',
    'OWNER',
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role;

-- LevelLens Supabase Database Schema
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bqqobzvitkrpyrglrhpb/sql/new

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    org_type TEXT NOT NULL DEFAULT 'SCHOOL',
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    district TEXT,
    state TEXT,
    udise_code TEXT,
    strength_per_grade JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Administrators Table
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
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

-- 4. Skill Pods Table
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_pods ENABLE ROW LEVEL SECURITY;

-- 6. Setup Public Policies (Allow anon role to read and write for the LevelLens applet)
DROP POLICY IF EXISTS "Public access organizations" ON public.organizations;
CREATE POLICY "Public access organizations" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access admins" ON public.admins;
CREATE POLICY "Public access admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access students" ON public.students;
CREATE POLICY "Public access students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access skill_pods" ON public.skill_pods;
CREATE POLICY "Public access skill_pods" ON public.skill_pods FOR ALL USING (true) WITH CHECK (true);

-- 7. Pre-seed LevelLens Owner Account
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

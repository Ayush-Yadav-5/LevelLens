import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, Copy, ExternalLink, RefreshCw, X, Shield, Users, School } from 'lucide-react';
import { storage, DbStatusInfo, supabaseUrl } from '../services/storage';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_CONTENT = `-- LevelLens Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bqqobzvitkrpyrglrhpb/sql/new

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

CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    roll_no INTEGER NOT NULL,
    grade INTEGER NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    gender TEXT DEFAULT 'Other',
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

CREATE TABLE IF NOT EXISTS public.skill_pods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    badge_title TEXT,
    level_descriptor TEXT,
    target_skill TEXT,
    color_class TEXT,
    bg_light_class TEXT,
    border_class TEXT,
    students_count INTEGER DEFAULT 0,
    activities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_pods ENABLE ROW LEVEL SECURITY;

-- Note: Secure production schema with pgcrypto hashing and role-based policies is configured in supabase-schema.sql.
`;

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<DbStatusInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await storage.checkHealth();
      setStatus(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  const projectId = supabaseUrl.replace('https://', '').split('.')[0] || 'supabase';
  const allTablesOk = status && Object.values(status.tables).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Supabase Database Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-mono">
                  PostgreSQL
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80 font-mono truncate max-w-md">
                {supabaseUrl}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Connection Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${allTablesOk ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {allTablesOk ? 'Supabase Fully Connected & Active' : 'Supabase Active • Tables Awaiting Setup'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Project Ref: <span className="font-mono font-medium text-slate-700">{projectId}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Check
              </button>
            </div>
          </div>

          {/* Table Verification Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              PostgreSQL Tables Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 font-mono">public.organizations</span>
                </div>
                {status?.tables.organizations ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 font-mono">public.students</span>
                </div>
                {status?.tables.students ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700 font-mono">public.admins</span>
                </div>
                {status?.tables.admins ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium text-slate-700 font-mono">public.skill_pods</span>
                </div>
                {status?.tables.skill_pods ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Setup instructions if any tables are pending */}
          {!allTablesOk && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold text-sm text-amber-950 mb-1">
                    Execute the Schema in your Supabase SQL Editor
                  </p>
                  To enable direct PostgreSQL storage on Supabase, paste and run this SQL script into your Supabase project editor. It automatically configures tables, RLS security policies, and seeds the LevelLens Owner credentials.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'SQL Copied to Clipboard!' : 'Copy SQL Schema'}
                </button>
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-950 rounded-lg text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                  Open Supabase SQL Editor
                </a>
              </div>
            </div>
          )}

          {/* SQL Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                SQL Schema Reference (supabase-schema.sql)
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
              {SQL_SCHEMA_CONTENT}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Organization, Student, SkillPod, OrgStatus, AdminUser } from '../types';
import { INITIAL_PODS } from '../data/mockData';

// Supabase Environment Variables - sanitize trailing /rest/v1 or slashes to root origin
function cleanSupabaseUrl(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
}

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const supabaseUrl = cleanSupabaseUrl(rawUrl);
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-project')
);

// Singleton pattern to prevent duplicate GoTrueClient instances during HMR / multiple imports
const globalForSupabase = globalThis as unknown as { __supabaseClient?: SupabaseClient };

export const supabase: SupabaseClient | null = (() => {
  if (!isSupabaseConfigured) return null;
  
  if (!globalForSupabase.__supabaseClient) {
    try {
      globalForSupabase.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return globalForSupabase.__supabaseClient;
})();

// Local cache keys (used as offline cache and fallback)
const ORGS_KEY = 'levellens_orgs_v3';
const STUDENTS_KEY = 'levellens_students_v3';
const PODS_KEY = 'levellens_pods_v3';
const ADMINS_KEY = 'levellens_admins_v3';

// Transformers to handle database fields safely (passwords are redacted on output)
function orgToDb(org: Organization): Record<string, any> {
  return {
    id: org.id,
    name: org.name,
    email: org.email.trim().toLowerCase(),
    password: org.password, // Postgres trigger will automatically bcrypt-hash this
    org_type: org.orgType,
    status: org.status,
    district: org.district || null,
    state: org.state || null,
    udise_code: org.udiseCode || null,
    strength_per_grade: org.strengthPerGrade || {},
    created_at: org.createdAt,
  };
}

function dbToOrg(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: '', // Never expose password hash to frontend state or local cache
    orgType: row.org_type || row.orgType || 'SCHOOL',
    status: (row.status as OrgStatus) || 'PENDING_APPROVAL',
    district: row.district || undefined,
    state: row.state || undefined,
    udiseCode: row.udise_code || row.udiseCode || undefined,
    strengthPerGrade: row.strength_per_grade || row.strengthPerGrade || {},
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

function studentToDb(student: Student): Record<string, any> {
  return {
    id: student.id,
    org_id: student.orgId,
    name: student.name,
    roll_no: student.rollNo,
    grade: student.grade,
    section: student.section,
    gender: student.gender,
    avatar_seed: student.avatarSeed || student.name,
    parent_phone: student.parentPhone,
    seating_row: student.seatingRow ?? 0,
    seating_col: student.seatingCol ?? 0,
    reading_level: student.readingLevel,
    math_level: student.mathLevel,
    reading_wpm: student.readingWpm,
    reading_accuracy: student.readingAccuracy,
    math_latency_ms: student.mathLatencyMs,
    reading_pod_id: student.readingPodId,
    math_pod_id: student.mathPodId,
    last_assessed_date: student.lastAssessedDate || 'Never',
    assessed_this_week: student.assessedThisWeek ?? false,
    phonetic_flags: student.phoneticFlags || [],
    math_flags: student.mathFlags || [],
    history: student.history || [],
  };
}

function dbToStudent(row: any): Student {
  return {
    id: row.id,
    orgId: row.org_id || row.orgId,
    name: row.name,
    rollNo: Number(row.roll_no || row.rollNo || 1),
    grade: Number(row.grade || 1) as any,
    section: row.section || 'A',
    gender: (row.gender === 'M' ? 'M' : 'F') as 'F' | 'M',
    avatarSeed: row.avatar_seed || row.avatarSeed || row.name || 'Student',
    parentPhone: row.parent_phone || row.parentPhone || '',
    seatingRow: Number(row.seating_row ?? row.seatingRow ?? 0),
    seatingCol: Number(row.seating_col ?? row.seatingCol ?? 0),
    readingLevel: row.reading_level || row.readingLevel || 'PRE_WORD',
    mathLevel: row.math_level || row.mathLevel || 'COUNT_20',
    readingWpm: Number(row.reading_wpm ?? row.readingWpm ?? 0),
    readingAccuracy: Number(row.reading_accuracy ?? row.readingAccuracy ?? 0),
    mathLatencyMs: Number(row.math_latency_ms ?? row.mathLatencyMs ?? 0),
    readingPodId: (row.reading_pod_id || row.readingPodId || 'R1') as 'R1' | 'R2' | 'R3',
    mathPodId: (row.math_pod_id || row.mathPodId || 'M1') as 'M1' | 'M2' | 'M3',
    lastAssessedDate: row.last_assessed_date || row.lastAssessedDate || 'Never',
    assessedThisWeek: Boolean(row.assessed_this_week ?? row.assessedThisWeek ?? false),
    phoneticFlags: Array.isArray(row.phonetic_flags) ? row.phonetic_flags : (row.phoneticFlags || []),
    mathFlags: Array.isArray(row.math_flags) ? row.math_flags : (row.mathFlags || []),
    history: Array.isArray(row.history) ? row.history : [],
  };
}

function adminToDb(admin: AdminUser): Record<string, any> {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email.trim().toLowerCase(),
    password: admin.password,
    role: admin.role,
    created_at: admin.createdAt,
  };
}

function dbToAdmin(row: any): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: '', // Never store or leak password hash back
    role: row.role || 'ADMIN',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export interface DbStatusInfo {
  isConfigured: boolean;
  projectUrl: string;
  hasOwnerSeeded: boolean;
  tables: {
    organizations: boolean;
    admins: boolean;
    students: boolean;
    skill_pods: boolean;
  };
  lastError: string | null;
}

class StorageService {
  private lastDbStatus: DbStatusInfo = {
    isConfigured: isSupabaseConfigured,
    projectUrl: supabaseUrl,
    hasOwnerSeeded: false,
    tables: {
      organizations: false,
      admins: false,
      students: false,
      skill_pods: false,
    },
    lastError: null,
  };

  private getLocal<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return fallback;
  }

  private setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  // Check health and existing tables on Supabase
  async checkHealth(): Promise<DbStatusInfo> {
    if (!supabase) {
      return this.lastDbStatus;
    }

    const tablesToCheck = ['organizations', 'admins', 'students', 'skill_pods'] as const;
    const results: Record<string, boolean> = {};
    let errorFound: string | null = null;

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          results[table] = false;
          if (!errorFound) errorFound = `Table "${table}": ${error.message}`;
        } else {
          results[table] = true;
        }
      } catch (err: any) {
        results[table] = false;
        if (!errorFound) errorFound = err.message || 'Network error';
      }
    }

    this.lastDbStatus = {
      isConfigured: true,
      projectUrl: supabaseUrl,
      hasOwnerSeeded: false,
      tables: {
        organizations: !!results.organizations,
        admins: !!results.admins,
        students: !!results.students,
        skill_pods: !!results.skill_pods,
      },
      lastError: errorFound,
    };

    return this.lastDbStatus;
  }

  // --- Organizations & School Accounts ---

  async getOrganizations(): Promise<Organization[]> {
    if (supabase) {
      try {
        // Never query passwords from remote DB
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, email, org_type, status, district, state, udise_code, strength_per_grade, created_at');
        if (!error && data) {
          const orgs = data.map(dbToOrg);
          this.setLocal(ORGS_KEY, orgs);
          return orgs;
        }
        if (error) {
          console.warn('Supabase organizations query returned:', error.message);
        }
      } catch (err) {
        console.warn('Supabase organizations fetch exception:', err);
      }
    }
    return this.getLocal<Organization[]>(ORGS_KEY, []);
  }

  async registerOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'status'>): Promise<Organization> {
    const newOrg: Organization = {
      ...org,
      id: `org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('organizations').insert([orgToDb(newOrg)]);
        if (error) {
          console.error('Supabase organization registration error:', error);
        }
      } catch (err) {
        console.error('Supabase organization registration network error:', err);
      }
    }

    // Strip password before updating local cache
    const cachedOrg = { ...newOrg, password: '' };
    const current = this.getLocal<Organization[]>(ORGS_KEY, []);
    this.setLocal(ORGS_KEY, [cachedOrg, ...current]);

    return cachedOrg;
  }

  async updateOrganizationStatus(orgId: string, status: OrgStatus): Promise<void> {
    const orgs = this.getLocal<Organization[]>(ORGS_KEY, []);
    const updated = orgs.map(o => o.id === orgId ? { ...o, status } : o);
    this.setLocal(ORGS_KEY, updated);

    if (supabase) {
      try {
        const { error } = await supabase.from('organizations').update({ status }).eq('id', orgId);
        if (error) {
          console.error('Supabase updateOrganizationStatus error:', error);
        }
      } catch (err) {
        console.error('Supabase updateOrganizationStatus network error:', err);
      }
    }
  }

  async deleteOrganization(orgId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Delete organization & students in one atomic call via elevated RPC
      if (supabase) {
        const { error: rpcErr } = await supabase.rpc('delete_organization_cascade', {
          p_org_id: orgId,
        });

        if (rpcErr) {
          console.error('Supabase deleteOrganization RPC error:', rpcErr);
          return { success: false, error: rpcErr.message };
        }
      }

      // 2. Remove the organization from local cache
      const orgs = this.getLocal<Organization[]>(ORGS_KEY, []);
      this.setLocal(ORGS_KEY, orgs.filter(o => o.id !== orgId));

      // 3. Remove all cached students belonging to this organization
      const students = this.getLocal<Student[]>(STUDENTS_KEY, []);
      this.setLocal(STUDENTS_KEY, students.filter(s => s.orgId !== orgId));

      // 4. Instantly revoke access if this school is currently logged in on this browser
      const activeOrgStr = localStorage.getItem('levellens_active_org');
      if (activeOrgStr) {
        try {
          const activeOrg = JSON.parse(activeOrgStr);
          if (activeOrg.id === orgId) {
            localStorage.removeItem('levellens_active_org');
            localStorage.removeItem('levellens_auth_token');
            localStorage.removeItem('levellens_org_session');
          }
        } catch {
          // Ignore JSON parse errors
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('deleteOrganization unhandled error:', err);
      return { success: false, error: err.message || 'Failed to delete organization' };
    }
  }

  // --- Students Management ---

  async getStudents(orgId: string): Promise<Student[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('org_id', orgId);

        if (!error && data) {
          const list = data.map(dbToStudent);
          const allLocal = this.getLocal<Student[]>(STUDENTS_KEY, []).filter(s => s.orgId !== orgId);
          this.setLocal(STUDENTS_KEY, [...allLocal, ...list]);
          return list;
        }
      } catch (err) {
        console.warn('Supabase getStudents query failed, falling back to local storage cache:', err);
      }
    }

    const allStudents = this.getLocal<Student[]>(STUDENTS_KEY, []);
    return allStudents.filter(s => s.orgId === orgId);
  }

  async saveStudent(student: Student): Promise<void> {
    const all = this.getLocal<Student[]>(STUDENTS_KEY, []);
    const existingIndex = all.findIndex(s => s.id === student.id);
    const updated = existingIndex >= 0 
      ? all.map(s => s.id === student.id ? student : s)
      : [...all, student];
    this.setLocal(STUDENTS_KEY, updated);

    if (supabase) {
      try {
        const dbPayload = studentToDb(student);
        const { error } = await supabase.from('students').upsert([dbPayload]);
        if (error) {
          console.error('Supabase saveStudent error:', error);
        }
      } catch (err) {
        console.error('Supabase saveStudent network error:', err);
      }
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    const all = this.getLocal<Student[]>(STUDENTS_KEY, []);
    this.setLocal(STUDENTS_KEY, all.filter(s => s.id !== studentId));

    if (supabase) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) console.error('Supabase deleteStudent error:', error);
      } catch (err) {
        console.error('Supabase deleteStudent network error:', err);
      }
    }
  }

  async findStudentByParentPhone(phone: string): Promise<Student | null> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .ilike('parent_phone', `%${cleanPhone}`);

        if (!error && data && data.length > 0) {
          return dbToStudent(data[0]);
        }
      } catch (err) {
        console.warn('Supabase parental lookup exception:', err);
      }
    }

    const all = this.getLocal<Student[]>(STUDENTS_KEY, []);
    return all.find(s => (s.parentPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone) || null;
  }

  // --- Skill Pods ---

  async getPods(): Promise<SkillPod[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('skill_pods').select('*');
        if (!error && data && data.length > 0) {
          this.setLocal(PODS_KEY, data);
          return data as SkillPod[];
        }
      } catch (err) {
        // fallback
      }
    }
    return this.getLocal<SkillPod[]>(PODS_KEY, INITIAL_PODS);
  }

  async savePods(pods: SkillPod[]): Promise<void> {
    this.setLocal(PODS_KEY, pods);
    if (supabase) {
      try {
        await supabase.from('skill_pods').upsert(pods);
      } catch {
        // ignore
      }
    }
  }

  // --- Admin Accounts & Authentications ---

  async getAdmins(): Promise<AdminUser[]> {
    let admins: AdminUser[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('id, name, email, role, created_at');
        if (!error && data && data.length > 0) {
          admins = data.map(dbToAdmin);
        }
      } catch (err) {
        console.warn('Supabase getAdmins network exception:', err);
      }
    }

    if (admins.length === 0) {
      admins = this.getLocal<AdminUser[]>(ADMINS_KEY, []);
    }

    return admins;
  }

  async authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary: Verify via Supabase RPC with bcrypt
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('verify_admin_password', {
          candidate_email: cleanEmail,
          candidate_password: password,
        });

        if (!error && data && data.length > 0) {
          return dbToAdmin(data[0]);
        }
      } catch (err) {
        console.warn('Supabase remote admin authentication exception:', err);
      }
    }

    // 2. Offline fallback (only matches unhashed local mock if running disconnected)
    const admins = this.getLocal<AdminUser[]>(ADMINS_KEY, []);
    const match = admins.find(
      a => a.email.toLowerCase() === cleanEmail && a.password && a.password === password
    );
    return match ? { ...match, password: '' } : null;
  }

  async authenticateSchool(email: string, password: string): Promise<Organization | null> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary: Verify via Supabase RPC with bcrypt
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('verify_org_password', {
          candidate_email: cleanEmail,
          candidate_password: password,
        });

        if (!error && data && data.length > 0) {
          return dbToOrg(data[0]);
        }
      } catch (err) {
        console.warn('Supabase remote school authentication exception:', err);
      }
    }

    // 2. Offline fallback
    const orgs = this.getLocal<Organization[]>(ORGS_KEY, []);
    const match = orgs.find(
      o => o.email.toLowerCase() === cleanEmail && o.password && o.password === password
    );
    return match ? { ...match, password: '' } : null;
  }

  async createAdmin(
    newAdmin: Omit<AdminUser, 'id' | 'createdAt'>, 
    requester: AdminUser
  ): Promise<{ success: boolean; error?: string; admin?: AdminUser }> {
    if (requester.role !== 'OWNER') {
      return { 
        success: false, 
        error: 'Unauthorized: Only the LevelLens Owner can register new administrators.' 
      };
    }

    const cleanEmail = newAdmin.email.trim().toLowerCase();
    if (!cleanEmail || !newAdmin.password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const admins = await this.getAdmins();
    if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
      return { 
        success: false, 
        error: 'An administrator with this email address already exists.' 
      };
    }

    let createdRecord: AdminUser | null = null;

    if (supabase) {
      try {
        // Attempt server-side hashed RPC first
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_admin', {
          p_name: newAdmin.name,
          p_email: cleanEmail,
          p_password: newAdmin.password,
          p_role: 'ADMIN',
        });

        if (!rpcError && rpcData) {
          createdRecord = dbToAdmin(rpcData);
        } else {
          // Fallback to direct insert if RPC isn't available
          const directAdmin: AdminUser = {
            ...newAdmin,
            email: cleanEmail,
            id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            role: 'ADMIN',
            createdAt: new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('admins').insert([adminToDb(directAdmin)]);
          if (insertError) {
            console.error('Supabase admin creation error:', insertError);
            return { success: false, error: insertError.message };
          }
          createdRecord = directAdmin;
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
      }
    }

    const finalAdmin: AdminUser = createdRecord || {
      ...newAdmin,
      email: cleanEmail,
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };

    const safeAdmin = { ...finalAdmin, password: '' };
    const updated = [...admins, safeAdmin];
    this.setLocal(ADMINS_KEY, updated);

    return { success: true, admin: safeAdmin };
  }

  async deleteAdmin(
    adminId: string, 
    requester: AdminUser
  ): Promise<{ success: boolean; error?: string }> {
    if (requester.role !== 'OWNER') {
      return { success: false, error: 'Unauthorized: Only the Owner can delete administrators.' };
    }

    const admins = await this.getAdmins();
    const target = admins.find(a => a.id === adminId);
    if (!target) {
      return { success: false, error: 'Administrator not found.' };
    }

    if (target.role === 'OWNER') {
      return { success: false, error: 'Cannot remove the primary LevelLens Owner account.' };
    }

    const updated = admins.filter(a => a.id !== adminId);
    this.setLocal(ADMINS_KEY, updated);

    if (supabase) {
      try {
        await supabase.from('admins').delete().eq('id', adminId);
      } catch (err) {
        console.error('Supabase deleteAdmin error:', err);
      }
    }

    return { success: true };
  }

  isUsingCloud(): boolean {
    return Boolean(supabase);
  }

  getSupabaseUrl(): string {
    return supabaseUrl;
  }
}

export const storage = new StorageService();
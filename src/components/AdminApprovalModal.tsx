import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Clock, 
  LogIn, 
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Crown,
  Trash2,
  Lock,
  Mail,
  User,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { Organization, OrgStatus, AdminUser } from '../types';
import { storage } from '../services/storage';

interface AdminApprovalModalProps {
  adminUser: AdminUser;
  onClose: () => void;
  onLogoutAdmin: () => void;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  adminUser,
  onClose,
  onLogoutAdmin,
}) => {
  const isOwner = adminUser.role === 'OWNER';
  const [activeAdminTab, setActiveAdminTab] = useState<'SCHOOLS' | 'ADMINS'>('SCHOOLS');

  // School approvals state
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  // Admin management state (Owner only)
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const loadOrgs = async () => {
    const list = await storage.getOrganizations();
    setOrgs(list);
  };

  const loadAdmins = async () => {
    const list = await storage.getAdmins();
    setAdminsList(list);
  };

  useEffect(() => {
    loadOrgs();
    loadAdmins();
  }, []);

  const handleUpdateStatus = async (orgId: string, status: OrgStatus) => {
    setIsUpdatingOrg(true);
    await storage.updateOrganizationStatus(orgId, status);
    await loadOrgs();
    setIsUpdatingOrg(false);
  };

  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError(null);
    setAdminFormSuccess(null);

    if (!isOwner) {
      setAdminFormError('Only the LevelLens platform Owner can add new administrators.');
      return;
    }

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminFormError('All fields (Name, Email, Password) are required.');
      return;
    }

    if (newAdminPassword.length < 6) {
      setAdminFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsCreatingAdmin(true);

    try {
      const res = await storage.createAdmin(
        {
          name: newAdminName.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          password: newAdminPassword,
          role: 'ADMIN',
        },
        adminUser
      );

      if (!res.success) {
        setAdminFormError(res.error || 'Failed to create admin.');
      } else {
        setAdminFormSuccess(`Administrator "${res.admin?.name}" (${res.admin?.email}) registered successfully!`);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        await loadAdmins();
      }
    } catch {
      setAdminFormError('Unexpected database error while creating admin.');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke admin access for "${name}"?`)) {
      return;
    }

    const res = await storage.deleteAdmin(id, adminUser);
    if (!res.success) {
      alert(res.error || 'Could not delete administrator.');
    } else {
      await loadAdmins();
    }
  };

  const filtered = orgs.filter(o => {
    if (filter === 'PENDING' && o.status !== 'PENDING_APPROVAL') return false;
    if (filter === 'APPROVED' && o.status !== 'APPROVED') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || (o.udiseCode && o.udiseCode.includes(q));
    }
    return true;
  });

  const pendingCount = orgs.filter(o => o.status === 'PENDING_APPROVAL').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
              isOwner 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              {isOwner ? <Crown className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">Platform Admin Center</h2>
                {isOwner ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> OWNER: {adminUser.name}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ADMIN: {adminUser.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-slate-200 font-mono">{adminUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogoutAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Sign out of Admin session and return to Landing Page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Back to Landing Page</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveAdminTab('SCHOOLS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'SCHOOLS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>School Registrations</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {pendingCount}
              </span>
            )}
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveAdminTab('ADMINS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === 'ADMINS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Manage Admins (Owner Only)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-800 text-amber-300 border border-amber-500/30">
                {adminsList.length}
              </span>
            </button>
          )}
        </div>

        {/* TAB 1: SCHOOL REGISTRATIONS */}
        {activeAdminTab === 'SCHOOLS' && (
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search school name, email or UDISE..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    filter === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({orgs.length})
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    filter === 'PENDING' ? 'bg-amber-500/20 text-amber-300 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    filter === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Approved ({orgs.filter(o => o.status === 'APPROVED').length})
                </button>
              </div>
            </div>

            {/* Organizations List */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                  <Building2 className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">No organizations found</p>
                  <p className="text-xs text-slate-600">
                    {filter === 'PENDING' 
                      ? 'No pending registrations awaiting approval.' 
                      : 'Schools or tuitions that register will appear here.'}
                  </p>
                </div>
              ) : (
                filtered.map((org) => {
                  const isApproved = org.status === 'APPROVED';
                  const isPending = org.status === 'PENDING_APPROVAL';

                  return (
                    <div 
                      key={org.id}
                      className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-sm">{org.name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {org.orgType.replace('_', ' ')}
                          </span>
                          {isPending && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {org.status === 'REJECTED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>📧 {org.email}</span>
                          <span>📍 {org.district}, {org.state}</span>
                          <span>👥 Strength: {org.strengthPerGrade} / class</span>
                          {org.udiseCode ? (
                            <span className="font-mono text-emerald-400">UDISE: {org.udiseCode}</span>
                          ) : (
                            <span className="text-slate-500 italic">No UDISE (Tuition / Local)</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(org.id, 'APPROVED')}
                              disabled={isUpdatingOrg}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(org.id, 'REJECTED')}
                              disabled={isUpdatingOrg}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 active:scale-95 text-rose-300 font-semibold text-xs rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              Active Organization
                            </span>
                            <button
                              onClick={() => handleUpdateStatus(org.id, 'PENDING_APPROVAL')}
                              disabled={isUpdatingOrg}
                              className="px-2.5 py-1 text-slate-400 hover:text-amber-400 text-xs transition-colors rounded-lg hover:bg-slate-800"
                              title="Revoke approval and move back to pending"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {org.status === 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(org.id, 'PENDING_APPROVAL')}
                            disabled={isUpdatingOrg}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                          >
                            Reconsider
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE ADMINISTRATORS (Strictly Owner Only) */}
        {activeAdminTab === 'ADMINS' && isOwner && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-300">LevelLens Owner Privilege</p>
                <p className="text-slate-300 leading-relaxed">
                  Only you (the Owner) can create and manage platform administrators. Admins created here will have credentials to log in, review school and tuition registrations, and validate accounts.
                </p>
              </div>
            </div>

            {/* Create Admin Form */}
            <form onSubmit={handleCreateNewAdmin} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Register New Administrator</h3>
              </div>

              {adminFormError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminFormError}</span>
                </div>
              )}

              {adminFormSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{adminFormSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Admin Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Admin Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@levellens.org"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isCreatingAdmin ? 'Registering Admin...' : 'Add Administrator'}</span>
                </button>
              </div>
            </form>

            {/* List of current administrators */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Administrators ({adminsList.length})
              </h4>

              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {adminsList.map((adm) => {
                  const isThisOwner = adm.role === 'OWNER';
                  return (
                    <div 
                      key={adm.id}
                      className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          isThisOwner ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {isThisOwner ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{adm.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isThisOwner ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {adm.role}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">{adm.email}</span>
                        </div>
                      </div>

                      <div>
                        {isThisOwner ? (
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Primary Account
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete administrator"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>LevelLens Primary School Admin & Verification Service</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};

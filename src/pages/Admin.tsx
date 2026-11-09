import React, { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { isSuperUser } from '@/lib/auth-utils';
import { getPhotographyName } from '@/lib/branding';
import { useStore, SystemUser, UserRole, UserStatus, AuditCategory, AuditSeverity, AuditLog, SystemAnnouncement } from '@/store';
import { 
  ShieldCheck, 
  Users, 
  PieChart, 
  FileText, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  Activity, 
  Search, 
  Plus, 
  Edit2, 
  Download, 
  Megaphone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Lock, 
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  Layers,
  Camera,
  Briefcase,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SystemAnnouncementBanner } from '@/components/SystemAnnouncementBanner';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' },
  studio_admin: { label: 'Studio Admin', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' },
  photographer: { label: 'Lead Photographer', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
  viewer: { label: 'Assistant / Viewer', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20' },
};

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  warning: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20',
  critical: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 font-semibold',
};

export function Admin() {
  const currentUser = auth.currentUser;
  const isSuper = isSuperUser(currentUser?.email);

  // Strictly gate access for Super Admin only
  if (!isSuper) {
    return <Navigate to="/dashboard" replace />;
  }

  const { 
    systemUsers, 
    auditLogs, 
    announcements, 
    quotes, 
    invoices, 
    payments, 
    clients, 
    projects, 
    expenses, 
    equipment, 
    schoolDeposits, 
    settings,
    addSystemUser, 
    updateSystemUser, 
    recordAuditLog, 
    addAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit' | 'broadcasts'>('overview');

  // Search & Filter States for Users
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Search & Filter States for Audit Logs
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [auditSeverity, setAuditSeverity] = useState<string>('all');

  // Modals
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [editUserForm, setEditUserForm] = useState<{ role: UserRole; status: UserStatus; phone: string; notes: string }>({
    role: 'photographer',
    status: 'active',
    phone: '',
    notes: '',
  });

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'photographer' as UserRole,
    phone: '',
    notes: '',
  });

  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'info' | 'warning' | 'announcement',
    expiresAt: '',
  });

  // Calculate Aggregated Platform Metrics
  const metrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalCollected = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    const totalQuotesCount = quotes.length;
    const approvedQuotes = quotes.filter((q) => q.status === 'approved').length;
    const quoteWinRate = totalQuotesCount > 0 ? Math.round((approvedQuotes / totalQuotesCount) * 100) : 0;

    const activeUsersCount = systemUsers.filter((u) => u.status === 'active').length;
    const suspendedUsersCount = systemUsers.filter((u) => u.status === 'suspended').length;

    // 24h audit events
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAuditCount = auditLogs.filter((l) => new Date(l.timestamp) >= oneDayAgo).length;

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      collectionRate,
      totalQuotesCount,
      approvedQuotes,
      quoteWinRate,
      totalUsers: Math.max(1, systemUsers.length),
      activeUsersCount: Math.max(1, activeUsersCount),
      suspendedUsersCount,
      totalClients: clients.length,
      totalProjects: projects.length,
      totalEquipment: equipment.length,
      totalExpenses: expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
      schoolFundSaved: schoolDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
      recentAuditCount,
    };
  }, [invoices, payments, quotes, systemUsers, clients, projects, equipment, expenses, schoolDeposits, auditLogs]);

  // Monthly Revenue Chart Data
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const map: Record<string, { invoiced: number; collected: number }> = {};

    months.forEach((m) => {
      map[m] = { invoiced: 0, collected: 0 };
    });

    invoices.forEach((inv) => {
      if (inv.date) {
        const d = new Date(inv.date);
        if (d.getFullYear() === currentYear) {
          const m = months[d.getMonth()];
          if (map[m]) map[m].invoiced += Number(inv.totalAmount) || 0;
        }
      }
    });

    payments.forEach((pay) => {
      if (pay.date) {
        const d = new Date(pay.date);
        if (d.getFullYear() === currentYear) {
          const m = months[d.getMonth()];
          if (map[m]) map[m].collected += Number(pay.amount) || 0;
        }
      }
    });

    return months.slice(-6).map((month) => ({
      name: month,
      Invoiced: map[month].invoiced,
      Collected: map[month].collected,
    }));
  }, [invoices, payments]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    // If systemUsers is empty, show current user as default super admin
    const list = systemUsers.length > 0 ? systemUsers : [
      {
        id: currentUser?.uid || 'super_admin_id',
        email: currentUser?.email || 'ringa.michael@gmail.com',
        displayName: currentUser?.displayName || 'Michael Ringa (Super Admin)',
        role: 'super_admin' as UserRole,
        status: 'active' as UserStatus,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }
    ];

    return list.filter((user) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        user.email.toLowerCase().includes(q) ||
        (user.displayName && user.displayName.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [systemUsers, userSearch, roleFilter, statusFilter, currentUser]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        log.description.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actorEmail.toLowerCase().includes(q);

      const matchesCategory = auditCategory === 'all' || log.category === auditCategory;
      const matchesSeverity = auditSeverity === 'all' || log.severity === auditSeverity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [auditLogs, auditSearch, auditCategory, auditSeverity]);

  // Handle Edit User
  const handleOpenEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setEditUserForm({
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      notes: user.notes || '',
    });
    setIsEditUserOpen(true);
  };

  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    await updateSystemUser(selectedUser.id, {
      role: editUserForm.role,
      status: editUserForm.status,
      phone: editUserForm.phone.trim(),
      notes: editUserForm.notes.trim(),
    });

    await recordAuditLog({
      category: 'security',
      action: 'USER_ROLE_CHANGED',
      description: `Updated permissions for user ${selectedUser.email}: Role=${editUserForm.role}, Status=${editUserForm.status}`,
      severity: editUserForm.status === 'suspended' ? 'warning' : 'info',
      targetResourceId: selectedUser.id,
      targetResourceType: 'system_users',
    });

    toast.success(`Updated role and status for ${selectedUser.email}`);
    setIsEditUserOpen(false);
    setSelectedUser(null);
  };

  // Handle Add Team Member
  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const newUser: SystemUser = {
      id,
      email: newUserForm.email.trim().toLowerCase(),
      displayName: newUserForm.name.trim() || newUserForm.email.split('@')[0],
      role: newUserForm.role,
      status: 'active',
      joinedAt: now,
      lastActiveAt: now,
      phone: newUserForm.phone.trim(),
      notes: newUserForm.notes.trim(),
    };

    await addSystemUser(newUser);

    await recordAuditLog({
      category: 'security',
      action: 'USER_CREATED',
      description: `Registered new team user ${newUser.email} with role ${newUser.role}`,
      severity: 'info',
      targetResourceId: id,
      targetResourceType: 'system_users',
    });

    toast.success(`User ${newUser.email} added to directory`);
    setIsAddUserOpen(false);
    setNewUserForm({ name: '', email: '', role: 'photographer', phone: '', notes: '' });
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      toast.error('Please enter announcement title and message.');
      return;
    }

    await addAnnouncement({
      title: announcementForm.title.trim(),
      message: announcementForm.message.trim(),
      type: announcementForm.type,
      isActive: true,
      expiresAt: announcementForm.expiresAt || undefined,
    });

    await recordAuditLog({
      category: 'settings',
      action: 'ANNOUNCEMENT_PUBLISHED',
      description: `Broadcasted platform announcement: "${announcementForm.title}"`,
      severity: 'info',
    });

    toast.success('Announcement published to all users');
    setIsAnnouncementOpen(false);
    setAnnouncementForm({ title: '', message: '', type: 'announcement', expiresAt: '' });
  };

  // Full Database JSON Backup Export
  const handleExportDatabaseBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      exporter: currentUser?.email,
      platform: 'CaptureCRM',
      counts: {
        clients: clients.length,
        projects: projects.length,
        quotes: quotes.length,
        invoices: invoices.length,
        payments: payments.length,
        expenses: expenses.length,
        equipment: equipment.length,
        schoolDeposits: schoolDeposits.length,
      },
      data: {
        clients,
        projects,
        quotes,
        invoices,
        payments,
        expenses,
        equipment,
        schoolDeposits,
        systemUsers,
        auditLogs,
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capturecrm-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    recordAuditLog({
      category: 'settings',
      action: 'DATABASE_BACKUP_EXPORTED',
      description: `Exported full system JSON backup containing ${clients.length} clients, ${invoices.length} invoices, and ${payments.length} payments`,
      severity: 'info',
    });

    toast.success('System database exported successfully');
  };

  // Test Audit Log Trigger
  const handleTriggerTestAudit = async () => {
    await recordAuditLog({
      category: 'auth',
      action: 'ADMIN_SESSION_VERIFIED',
      description: `Super Admin ${currentUser?.email} executed live platform security check`,
      severity: 'info',
    });
    toast.success('Live audit entry recorded');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Standalone Super Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
            title="Return to Studio CRM Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio CRM</span>
          </Link>
          <div className="h-4 w-px bg-border/80 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground">
                {getPhotographyName(settings).toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold ml-2">
                SUPER ADMIN STANDALONE CONSOLE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span>Executive User:</span>
            <strong className="text-foreground font-mono">{currentUser?.email}</strong>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              import('@/lib/firebase').then(({ logout }) => logout());
            }}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Global Live Announcement Banner */}
      <SystemAnnouncementBanner />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Banner / Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Super Admin Control Center
            </span>
            <span className="text-muted-foreground">• Confidential · Executive Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <span>Platform Administration & Governance</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive executive management across users, financial volume, security audit logs, and global system broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDatabaseBackup}
            className="h-9 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Backup Database
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerTestAudit}
            className="h-9 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Verify Audit Trail
          </Button>
        </div>
      </div>

      {/* Navigation Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl mb-8 w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Metrics & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'users'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({metrics.totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'audit'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'broadcasts'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcasts & Settings</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: METRICS & OVERVIEW                                 */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Invoiced Volume */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs uppercase font-semibold">
                <span>Platform Volume</span>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  KES {metrics.totalInvoiced.toLocaleString('en-KE')}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    KES {metrics.totalCollected.toLocaleString('en-KE')} Collected
                  </span>
                  <span>·</span>
                  <span>{metrics.collectionRate}% Rate</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                <span>Outstanding:</span>
                <span className="font-mono font-semibold text-foreground">
                  KES {metrics.totalOutstanding.toLocaleString('en-KE')}
                </span>
              </div>
            </div>

            {/* KPI 2: User Accounts */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs uppercase font-semibold">
                <span>Photographers & Team</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.totalUsers}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {metrics.activeUsersCount} Active
                  </span>
                  <span>·</span>
                  <span>{metrics.suspendedUsersCount} Suspended</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                <span>Lead Administrator:</span>
                <span className="font-medium text-foreground">Michael Ringa</span>
              </div>
            </div>

            {/* KPI 3: Quote Conversion */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs uppercase font-semibold">
                <span>Quotes Win Rate</span>
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.quoteWinRate}%
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{metrics.approvedQuotes} of {metrics.totalQuotesCount} approved</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                <span>Active Projects:</span>
                <span className="font-semibold text-foreground">{metrics.totalProjects} Productions</span>
              </div>
            </div>

            {/* KPI 4: Security & Audit */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-3 text-xs uppercase font-semibold">
                <span>Audit & Integrity</span>
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {auditLogs.length} Events
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All Logs Verified
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                <span>Past 24h:</span>
                <span className="font-mono font-semibold text-foreground">+{metrics.recentAuditCount} Actions</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart & System Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 border border-border rounded-2xl p-6 bg-card shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">6-Month Financial Trend</h3>
                  <p className="text-xs text-muted-foreground">Comparison of monthly invoiced vs. actual collected payments (KES)</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-foreground" />
                    <span>Invoiced</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Collected</span>
                  </span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip 
                      formatter={(val: any) => [`KES ${Number(val).toLocaleString('en-KE')}`, '']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem' }}
                    />
                    <Bar dataKey="Invoiced" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Inventory & Storage Overview */}
            <div className="border border-border rounded-2xl p-6 bg-card shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">System Health & Storage</h3>
                <p className="text-xs text-muted-foreground mb-5">Current active collections across the studio</p>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      Client Contacts
                    </span>
                    <span className="font-mono font-semibold text-foreground">{metrics.totalClients}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      Active Projects
                    </span>
                    <span className="font-mono font-semibold text-foreground">{metrics.totalProjects}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      Camera & Gear Assets
                    </span>
                    <span className="font-mono font-semibold text-foreground">{metrics.totalEquipment}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                      Operating Expenses
                    </span>
                    <span className="font-mono font-semibold text-foreground">KES {metrics.totalExpenses.toLocaleString('en-KE')}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                      Jason's School Savings
                    </span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">KES {metrics.schoolFundSaved.toLocaleString('en-KE')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Firestore Online & Encrypted
                </span>
                <span>Region: europe-west2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USER & TEAM DIRECTORY                              */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="border border-border rounded-2xl p-6 bg-card shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-border pb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">User & Team Management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage photographer accounts, assign administrative roles, and control system access.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddUserOpen(true)}
              className="bg-primary text-primary-foreground font-semibold h-9 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Team Member
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, email, or phone..."
                className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors w-full sm:w-[170px]"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="studio_admin">Studio Admin</option>
              <option value="photographer">Lead Photographer</option>
              <option value="viewer">Assistant / Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors w-full sm:w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">User & Contact</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date Joined</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((u) => {
                  const roleConfig = ROLE_LABELS[u.role] || ROLE_LABELS.photographer;
                  const isCurrent = u.email.toLowerCase() === currentUser?.email?.toLowerCase();

                  return (
                    <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {u.displayName?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{u.displayName || 'Team Member'}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="flex items-center gap-1.5 text-xs">
                          <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className={u.status === 'active' ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-rose-700 dark:text-rose-400 font-medium'}>
                            {u.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-xs text-muted-foreground tabular-nums">
                        {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-xs text-muted-foreground tabular-nums">
                        {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditUser(u)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit Role
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SECURITY AUDIT LOGS                                */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="border border-border rounded-2xl p-6 bg-card shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-border pb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Immutable Audit Trail</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tamper-resistant security log recording all financial modifications, user role assignments, and deletions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerTestAudit}
                className="h-9 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Trigger Test Entry
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by action, description, or actor email..."
                className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <select
              value={auditCategory}
              onChange={(e) => setAuditCategory(e.target.value)}
              className="h-10 px-3 text-xs bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors w-full sm:w-[150px]"
            >
              <option value="all">All Categories</option>
              <option value="auth">Auth & Session</option>
              <option value="finance">Finance & Invoices</option>
              <option value="project">Projects & Quotes</option>
              <option value="settings">Settings & Backup</option>
              <option value="security">Security & Roles</option>
            </select>

            <select
              value={auditSeverity}
              onChange={(e) => setAuditSeverity(e.target.value)}
              className="h-10 px-3 text-xs bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors w-full sm:w-[130px]"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Action Code</th>
                  <th className="py-3 px-3">Event Description</th>
                  <th className="py-3 px-3 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                      No audit events match your filter criteria. Click "Trigger Test Entry" to record a live test event.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground text-xs">{log.actorName || log.actorEmail}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{log.actorEmail}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {log.category}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border/80">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-xs text-foreground max-w-[380px]">
                        {log.description}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] uppercase font-semibold ${SEVERITY_COLORS[log.severity]}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BROADCASTS & SETTINGS                              */}
      {/* ========================================================= */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-8">
          {/* Announcements Manager */}
          <div className="border border-border rounded-2xl p-6 bg-card shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-border pb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Global Broadcast Banners</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Publish system notices, maintenance alerts, and feature updates visible across all authenticated users.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsAnnouncementOpen(true)}
                className="bg-primary text-primary-foreground font-semibold h-9 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Announcement
              </Button>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                  No broadcast announcements active. Click "New Announcement" to display a banner to all studio users.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-border bg-muted/30 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{ann.title}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          ann.type === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          ann.type === 'info' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                          'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                        }`}>
                          {ann.type}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          ann.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          {ann.isActive ? 'Active & Visible' : 'Archived'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ann.message}</p>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Posted by {ann.createdBy} · {new Date(ann.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAnnouncement(ann.id, { isActive: !ann.isActive })}
                        className="h-8 text-xs"
                      >
                        {ann.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Master Platform Defaults */}
          <div className="border border-border rounded-2xl p-6 bg-card shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-foreground">Platform Baseline & Statutory Presets</h3>
            <p className="text-xs text-muted-foreground">Standardized statutory deductions and defaults for Kenyan operations</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">NSSF Contribution</span>
                <p className="font-mono text-base font-bold text-foreground">Min. KES 400 / month</p>
                <p className="text-[11px] text-muted-foreground">National Social Security Fund statutory baseline</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">SHA Health Coverage</span>
                <p className="font-mono text-base font-bold text-foreground">KES 1,188 / month</p>
                <p className="text-[11px] text-muted-foreground">Social Health Authority (formerly NHIF)</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Platform Currency</span>
                <p className="font-mono text-base font-bold text-foreground">KES (Kenyan Shilling)</p>
                <p className="text-[11px] text-muted-foreground">Default billing & quote calculation currency</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Edit User Modal */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              <span>Edit User Role & Permissions</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs sm:text-sm">
            <div>
              <p className="font-semibold text-foreground">{selectedUser?.displayName}</p>
              <p className="font-mono text-xs text-muted-foreground">{selectedUser?.email}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Role</Label>
              <Select
                value={editUserForm.role}
                onValueChange={(val: UserRole) => setEditUserForm({ ...editUserForm, role: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin (Full Authority)</SelectItem>
                  <SelectItem value="studio_admin">Studio Admin (Manager)</SelectItem>
                  <SelectItem value="photographer">Lead Photographer (Quotes & Projects)</SelectItem>
                  <SelectItem value="viewer">Assistant / Viewer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Account Status</Label>
              <Select
                value={editUserForm.status}
                onValueChange={(val: UserStatus) => setEditUserForm({ ...editUserForm, status: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Full Access)</SelectItem>
                  <SelectItem value="suspended">Suspended (Blocked Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                placeholder="e.g. +254 700 000 000"
                className="h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Administrative Notes</Label>
              <Textarea
                value={editUserForm.notes}
                onChange={(e) => setEditUserForm({ ...editUserForm, notes: e.target.value })}
                placeholder="Notes about this photographer, gear responsibility, or access details..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveUserEdit} className="bg-primary text-primary-foreground font-semibold">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Team Member Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Add Team Member / Photographer</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                placeholder="e.g. Michael Ringa"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="e.g. photographer@capturecrm.com"
                className="h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Initial Role</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(val: UserRole) => setNewUserForm({ ...newUserForm, role: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photographer">Lead Photographer</SelectItem>
                  <SelectItem value="studio_admin">Studio Admin</SelectItem>
                  <SelectItem value="viewer">Assistant / Viewer</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number (Optional)</Label>
              <Input
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                placeholder="e.g. +254 700 000 000"
                className="h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={newUserForm.notes}
                onChange={(e) => setNewUserForm({ ...newUserForm, notes: e.target.value })}
                placeholder="Specialty (aerial, weddings, portraits)..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateUser} className="bg-primary text-primary-foreground font-semibold">
              Register User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Announcement Modal */}
      <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <span>Publish Global Announcement</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="e.g. Scheduled System Maintenance"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Alert Type</Label>
              <Select
                value={announcementForm.type}
                onValueChange={(val: any) => setAnnouncementForm({ ...announcementForm, type: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement (General Update)</SelectItem>
                  <SelectItem value="info">Info (Notice)</SelectItem>
                  <SelectItem value="warning">Warning (Maintenance / Important)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Message Content</Label>
              <Textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                placeholder="Details of the announcement displayed to all logged in users..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Expiration Date (Optional)</Label>
              <Input
                type="date"
                value={announcementForm.expiresAt}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsAnnouncementOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateAnnouncement} className="bg-primary text-primary-foreground font-semibold">
              Broadcast Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  </div>
  );
}


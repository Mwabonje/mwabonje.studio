import { create } from 'zustand';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, getDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  nationality?: string;
  leadSource?: string;
  uid?: string;
  allocations?: Record<number, number>;
};

export type CollaboratorSplit = {
  id: string;
  name: string;
  role?: string;
  splitType: 'equal' | 'percentage' | 'fixed' | 'transport';
  percentage?: number;
  amount?: number;
  description?: string;
};

export type Milestone = {
  id: string;
  title: string;
  completed: boolean;
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  location: string;
  date: string;
  
  description: string;
  collaborators: CollaboratorSplit[];
  milestones?: Milestone[];
  uid?: string;
  allocations?: Record<number, number>;
};

export type LineItem = {
  id: string;
  description: string;
  price: number;
};

export type QuotePackageBreakdownItem = {
  description: string;
  amount: number;
};

export type QuotePackage = {
  id: string;
  name: string;
  inclusions: string[];
  breakdown?: QuotePackageBreakdownItem[];
  settlement: number;
  isMostPopular?: boolean;
};

export type QuoteDeliverableTask = {
  id: string;
  title: string;
  items: string[];
};

export type Quote = {
  id: string;
  quoteNumber?: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNationality?: string;
  clientLeadSource?: string;
  projectTitle: string;
  location?: string;
  shootingTime?: string;
  photographers?: string;
  issueDate: string;
  eventDate: string;
  moodboardLink: string;
  packages: QuotePackage[];
  note: string;
  retainerClause: string;
  fulfillmentSchedule: string;
  usageLicense: string;
  usageRights: string;
  transportLogistics: string;
  cancellationRescheduling: string;
  weatherConditions?: string;
  paymentDetails: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'declined';
  date: string;
  
  selectedPackages?: string[];
  revisionOf?: string;
  quoteValidity?: string;
  isCollaboration?: boolean;
  collaborationCut?: number;
  collaborationType?: 'percentage' | 'fixed';
  deliverablesSubTitle?: string;
  deliverablesTitle?: string;
  deliverablesPrice?: number;
  deliverablesNote?: string;
  deliverableTasks?: QuoteDeliverableTask[];
  uid?: string;
  allocations?: Record<number, number>;
  hasCommercialLicense?: boolean;
  selectionAndStorage?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber?: string;
  quoteId?: string;
  projectId: string;
  clientId: string;
  lineItems: LineItem[];
  totalAmount: number;
  amountPaid: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  date: string;
  dueDate: string;
  uid?: string;
};

export type Payment = {
  id: string;
  receiptNumber?: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'cash' | 'mpesa' | 'bank' | 'paypal';
  reference?: string;
  uid?: string;
  allocations?: Record<number, number>;
};

export type Settings = {
  logoUrl: string;
  companyName: string;
  ownerName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  colorScheme: string;
  paymentDetails: string;
  companySignature?: string;
  documentTheme?: 'classic' | 'modern' | 'minimal';
};

export type ProjectTemplate = {
  id: string;
  name: string;
  title: string;
  location: string;
  description: string;
  collaborators: CollaboratorSplit[];
  uid?: string;
  allocations?: Record<number, number>;
};

export type Equipment = {
  id: string;
  name: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition?: string;
  notes?: string;
  uid?: string;
};


export type Reminder = {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO format
  amount?: number;
  category?: string;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'dismissed';
  uid?: string;
};

export type Expense = {
  id: string;
  date: string;
  billingMonth?: string;
  amount: number;
  category: string;
  vendor: string;
  description?: string;
  mpesaReference?: string;
  uid?: string;
};

export type FeedbackType = 'feature' | 'bug' | 'improvement' | 'general';
export type FeedbackStatus = 'new' | 'in_review' | 'planned' | 'resolved' | 'dismissed';

export type Feedback = {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  type: FeedbackType;
  title?: string;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  rating?: number;
  adminNotes?: string;
};

export type UserRole = 'super_admin' | 'studio_admin' | 'photographer' | 'viewer';
export type UserStatus = 'active' | 'suspended';

export type SystemUser = {
  id: string; // userId (auth UID)
  email: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastActiveAt?: string;
  phone?: string;
  notes?: string;
  quotesCount?: number;
  invoicesCount?: number;
  clientsCount?: number;
  lifetimeVolume?: number;
};

export type AuditCategory = 'auth' | 'finance' | 'project' | 'settings' | 'security';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export type AuditLog = {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorName?: string;
  category: AuditCategory;
  action: string;
  description: string;
  severity: AuditSeverity;
  targetResourceId?: string;
  targetResourceType?: string;
  metadata?: Record<string, any>;
};

export type SystemAnnouncement = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'announcement';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
};

export type SchoolDepositMethod = 'mpesa' | 'bank_transfer' | 'standing_order' | 'cash' | 'cheque' | 'other';
export type SchoolDepositPurpose = 'tuition' | 'admission' | 'uniform_books' | 'transport_meals' | 'general_savings' | 'other';

export type SchoolDeposit = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: SchoolDepositMethod;
  mpesaReference?: string;
  targetTerm: string; // e.g. "Term 1 2027", "Term 2 2027", "Term 3 2027", "General School Fund"
  purpose: SchoolDepositPurpose;
  notes?: string;
  bankName?: string;
  accountNumber?: string;
  depositedBy?: string;
  receiptNumber?: string;
  uid?: string;
  createdAt?: string;
};

export type SchoolAccountMeta = {
  accountName: string;
  sonName?: string;
  bankName?: string;
  accountNumber?: string;
  paybillOrTill?: string;
  paybillAccountRef?: string;
  targetGoal: number;
  targetDate?: string;
  notes?: string;
};

export const defaultSchoolAccountMeta: SchoolAccountMeta = {
  accountName: "Jason's School Fees Account",
  sonName: "Jason",
  bankName: "Equity Bank",
  accountNumber: "",
  paybillOrTill: "",
  paybillAccountRef: "",
  targetGoal: 150000,
  targetDate: "2027-01-10",
  notes: "Dedicated savings account for Jason's school fees.",
};

type AppState = {
  clients: Client[];
  projects: Project[];
  projectTemplates: ProjectTemplate[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  equipment: Equipment[];
  expenses: Expense[];
  reminders: Reminder[];
  feedbacks: Feedback[];
  schoolDeposits: SchoolDeposit[];
  schoolAccountMeta: SchoolAccountMeta;
  systemUsers: SystemUser[];
  registeredAuthUsers: Array<{ id: string; email?: string; lastLogin?: string }>;
  auditLogs: AuditLog[];
  announcements: SystemAnnouncement[];
  settings: Settings;
  isSettingsLoaded: boolean;
  isAuthReady: boolean;
  userId: string | null;

  setAuthReady: (ready: boolean, userId: string | null) => void;
  setSettingsLoaded: (loaded: boolean) => void;
  setSystemUsers: (users: SystemUser[]) => void;
  setAuditLogs: (logs: AuditLog[]) => void;
  setAnnouncements: (announcements: SystemAnnouncement[]) => void;

  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addProjectTemplate: (template: ProjectTemplate) => Promise<void>;
  updateProjectTemplate: (id: string, template: Partial<ProjectTemplate>) => Promise<void>;
  deleteProjectTemplate: (id: string) => Promise<void>;

  addQuote: (quote: Quote) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addPayment: (payment: Payment) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  addEquipment: (equipment: Equipment) => Promise<void>;
  updateEquipment: (id: string, equipment: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addReminder: (reminder: Reminder) => Promise<void>;
  updateReminder: (id: string, reminder: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  addFeedback: (feedback: Feedback) => Promise<void>;
  updateFeedback: (id: string, feedback: Partial<Feedback>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;

  addSchoolDeposit: (deposit: SchoolDeposit) => Promise<void>;
  updateSchoolDeposit: (id: string, deposit: Partial<SchoolDeposit>) => Promise<void>;
  deleteSchoolDeposit: (id: string) => Promise<void>;
  updateSchoolAccountMeta: (meta: Partial<SchoolAccountMeta>) => Promise<void>;

  addSystemUser: (user: SystemUser) => Promise<void>;
  updateSystemUser: (id: string, user: Partial<SystemUser>) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;
  recordAuditLog: (log: {
    category: AuditCategory;
    action: string;
    description: string;
    severity?: AuditSeverity;
    targetResourceId?: string;
    targetResourceType?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  addAnnouncement: (announcement: Omit<SystemAnnouncement, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateAnnouncement: (id: string, announcement: Partial<SystemAnnouncement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  updateSettings: (settings: Partial<Settings>) => Promise<void>;
};

export const defaultSettings: Settings = {
  logoUrl: '',
  companyName: '',
  ownerName: '',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  colorScheme: 'slate',
  paymentDetails: '',
};

const getInitialSettings = (): Settings => {
  if (typeof window !== 'undefined') {
    try {
      // Only load cached settings if they belong to the currently authenticated user
      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        const stored = localStorage.getItem(`capturecrm_settings_${currentUid}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...defaultSettings, ...parsed };
        }
      }
    } catch (e) {}
  }
  return defaultSettings;
};

const getInitialSchoolAccountMeta = (): SchoolAccountMeta => {
  if (typeof window !== 'undefined') {
    try {
      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        const stored = localStorage.getItem(`capturecrm_school_meta_${currentUid}`);
        if (stored) {
          return { ...defaultSchoolAccountMeta, ...JSON.parse(stored) };
        }
      }
      const general = localStorage.getItem('capturecrm_school_meta');
      if (general) {
        return { ...defaultSchoolAccountMeta, ...JSON.parse(general) };
      }
    } catch (e) {}
  }
  return defaultSchoolAccountMeta;
};

const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = cleanData(obj[key]);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

let lastActivityTouchMs = 0;

export const touchUserActivity = async (force = false) => {
  const user = auth.currentUser;
  if (!user) return;
  const nowMs = Date.now();
  if (!force && nowMs - lastActivityTouchMs < 30_000) return;
  lastActivityTouchMs = nowMs;

  const nowIso = new Date(nowMs).toISOString();
  try {
    const sysRef = doc(db, 'system_users', user.uid);
    const snap = await getDoc(sysRef);
    if (snap.exists()) {
      await updateDoc(sysRef, { lastActiveAt: nowIso });
    } else {
      await setDoc(sysRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Studio User',
        role: 'photographer',
        status: 'active',
        joinedAt: nowIso,
        lastActiveAt: nowIso,
      });
    }
  } catch (e) {
    // ignore
  }
};

export const useStore = create<AppState>((set, get) => ({
  clients: [],
  projects: [],
  projectTemplates: [],
  quotes: [],
  invoices: [],
  payments: [],
  equipment: [],
  expenses: [],
  reminders: [],
  feedbacks: [],
  schoolDeposits: [],
  schoolAccountMeta: getInitialSchoolAccountMeta(),
  systemUsers: [],
  registeredAuthUsers: [],
  auditLogs: [],
  announcements: [],
  settings: getInitialSettings(),
  isSettingsLoaded: false,
  isAuthReady: false,
  userId: null,

  setAuthReady: (ready, userId) => set({ isAuthReady: ready, userId }),
  setSettingsLoaded: (loaded) => set({ isSettingsLoaded: loaded }),
  setSystemUsers: (systemUsers) => set({ systemUsers }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAnnouncements: (announcements) => set({ announcements }),

  addProjectTemplate: async (template) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...template, uid });
    await setDoc(doc(db, `users/${uid}/project_templates`, template.id), data);
  },
  updateProjectTemplate: async (id, template) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().projectTemplates.find(t => t.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/project_templates`, id), cleanData({ ...existing, ...template, uid }));
  },
  deleteProjectTemplate: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/project_templates`, id));
  },

  addClient: async (client) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...client, uid });
    await setDoc(doc(db, `users/${uid}/clients`, client.id), data);
    touchUserActivity();
    get().recordAuditLog({
      category: 'project',
      action: 'CLIENT_CREATED',
      description: `Client profile "${client.name}" registered`,
      targetResourceId: client.id,
      targetResourceType: 'clients',
    });
  },
  updateClient: async (id, client) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().clients.find(c => c.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/clients`, id), cleanData({ ...existing, ...client, uid }));
    touchUserActivity();
  },
  deleteClient: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/clients`, id));
    touchUserActivity();
  },

  addProject: async (project) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...project, uid });
    await setDoc(doc(db, `users/${uid}/projects`, project.id), data);
    touchUserActivity();
    get().recordAuditLog({
      category: 'project',
      action: 'PROJECT_CREATED',
      description: `Project "${project.title}" created`,
      targetResourceId: project.id,
      targetResourceType: 'projects',
    });
  },
  updateProject: async (id, project) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().projects.find(p => p.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/projects`, id), cleanData({ ...existing, ...project, uid }));
    touchUserActivity();
  },
  deleteProject: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/projects`, id));
    touchUserActivity();
  },

  addQuote: async (quote) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...quote, uid });
    await setDoc(doc(db, `users/${uid}/quotes`, quote.id), data);
    touchUserActivity();
    get().recordAuditLog({
      category: 'project',
      action: 'QUOTE_CREATED',
      description: `Quote generated for KES ${(Number(quote.totalAmount) || 0).toLocaleString()}`,
      targetResourceId: quote.id,
      targetResourceType: 'quotes',
    });
  },
  updateQuote: async (id, quote) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().quotes.find(q => q.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/quotes`, id), cleanData({ ...existing, ...quote, uid }));
  },
  deleteQuote: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const quote = get().quotes.find(q => q.id === id);
    
    // Delete the quote
    await deleteDoc(doc(db, `users/${uid}/quotes`, id));
    
    // Delete related invoices and their payments
    const relatedInvoices = get().invoices.filter(i => i.quoteId === id);
    for (const invoice of relatedInvoices) {
      await deleteDoc(doc(db, `users/${uid}/invoices`, invoice.id));
      
      // Delete payments for this invoice
      const relatedPayments = get().payments.filter(p => p.invoiceId === invoice.id);
      for (const payment of relatedPayments) {
        await deleteDoc(doc(db, `users/${uid}/payments`, payment.id));
      }
    }
    
    // Delete related project if it exists
    if (quote?.projectId) {
      await deleteDoc(doc(db, `users/${uid}/projects`, quote.projectId));
    }
  },

  addInvoice: async (invoice) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...invoice, uid });
    await setDoc(doc(db, `users/${uid}/invoices`, invoice.id), data);
    touchUserActivity();
    get().recordAuditLog({
      category: 'finance',
      action: 'INVOICE_CREATED',
      description: `Invoice #${invoice.invoiceNumber || invoice.id.slice(0, 8)} generated (KES ${(Number(invoice.totalAmount) || 0).toLocaleString()})`,
      targetResourceId: invoice.id,
      targetResourceType: 'invoices',
    });
  },
  updateInvoice: async (id, invoice) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().invoices.find(i => i.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/invoices`, id), cleanData({ ...existing, ...invoice, uid }));
    touchUserActivity();
  },
  deleteInvoice: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    // Delete payments for this invoice
    const relatedPayments = get().payments.filter(p => p.invoiceId === id);
    for (const payment of relatedPayments) {
      await deleteDoc(doc(db, `users/${uid}/payments`, payment.id));
    }
    
    await deleteDoc(doc(db, `users/${uid}/invoices`, id));
    touchUserActivity();
  },

  addPayment: async (payment) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...payment, uid });
    await setDoc(doc(db, `users/${uid}/payments`, payment.id), data);
    touchUserActivity();
    get().recordAuditLog({
      category: 'finance',
      action: 'PAYMENT_RECORDED',
      description: `Payment of KES ${(Number(payment.amount) || 0).toLocaleString()} via ${payment.method?.toUpperCase()} recorded`,
      targetResourceId: payment.id,
      targetResourceType: 'payments',
    });
    
    // Update invoice balance
    const invoice = get().invoices.find((i) => i.id === payment.invoiceId);
    if (invoice) {
      const newAmountPaid = invoice.amountPaid + payment.amount;
      let newStatus: Invoice['status'] = 'unpaid';
      if (newAmountPaid >= invoice.totalAmount) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }
      await setDoc(doc(db, `users/${uid}/invoices`, invoice.id), cleanData({ ...invoice, amountPaid: newAmountPaid, status: newStatus, uid }));
    }
  },
  updatePayment: async (id, payment) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const oldPayment = get().payments.find((p) => p.id === id);
    if (!oldPayment) return;
    await setDoc(doc(db, `users/${uid}/payments`, id), cleanData({ ...oldPayment, ...payment, uid }));

    // If amount changed, update invoice balance
    if (payment.amount !== undefined && payment.amount !== oldPayment.amount) {
      const amountDiff = payment.amount - oldPayment.amount;
      const invoice = get().invoices.find((i) => i.id === oldPayment.invoiceId);
      if (invoice) {
        const newAmountPaid = invoice.amountPaid + amountDiff;
        let newStatus: Invoice['status'] = 'unpaid';
        if (newAmountPaid >= invoice.totalAmount) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partially_paid';
        }
        await setDoc(doc(db, `users/${uid}/invoices`, invoice.id), cleanData({ ...invoice, amountPaid: newAmountPaid, status: newStatus, uid }));
      }
    }
  },
  deletePayment: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const payment = get().payments.find((p) => p.id === id);
    if (!payment) return;
    await deleteDoc(doc(db, `users/${uid}/payments`, id));

    // Revert invoice balance
    const invoice = get().invoices.find((i) => i.id === payment.invoiceId);
    if (invoice) {
      const newAmountPaid = invoice.amountPaid - payment.amount;
      let newStatus: Invoice['status'] = 'unpaid';
      if (newAmountPaid >= invoice.totalAmount) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }
      await setDoc(doc(db, `users/${uid}/invoices`, invoice.id), cleanData({ ...invoice, amountPaid: newAmountPaid, status: newStatus, uid }));
    }
  },

  addEquipment: async (equipment) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...equipment, uid });
    await setDoc(doc(db, `users/${uid}/equipment`, equipment.id), data);
  },
  updateEquipment: async (id, equipment) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().equipment.find((e) => e.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/equipment`, id), cleanData({ ...existing, ...equipment, uid }));
  },
  deleteEquipment: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/equipment`, id));
  },

  addExpense: async (expense) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...expense, uid });
    await setDoc(doc(db, `users/${uid}/expenses`, expense.id), data);
    touchUserActivity();
    get().recordAuditLog({
      category: 'finance',
      action: 'EXPENSE_RECORDED',
      description: `Operating expense "${expense.category}" (KES ${(Number(expense.amount) || 0).toLocaleString()}) to ${expense.vendor || 'Vendor'} logged`,
      targetResourceId: expense.id,
      targetResourceType: 'expenses',
    });
  },
  updateExpense: async (id, expense) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().expenses.find((e) => e.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/expenses`, id), cleanData({ ...existing, ...expense, uid }));
    touchUserActivity();
  },
  deleteExpense: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/expenses`, id));
    touchUserActivity();
  },

  
  addReminder: async (reminder) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...reminder, uid });
    await setDoc(doc(db, `users/${uid}/reminders`, reminder.id), data);
  },
  updateReminder: async (id, reminder) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().reminders.find((r) => r.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/reminders`, id), cleanData({ ...existing, ...reminder, uid }));
  },
  deleteReminder: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/reminders`, id));
  },

  addFeedback: async (feedback) => {
    const data = cleanData(feedback);
    await setDoc(doc(db, 'feedbacks', feedback.id), data);
    set((state) => ({ feedbacks: [feedback, ...state.feedbacks.filter(f => f.id !== feedback.id)] }));
    touchUserActivity();
    get().recordAuditLog({
      category: 'settings',
      action: 'FEEDBACK_SUBMITTED',
      description: `Submitted ${feedback.type}: "${feedback.title || feedback.message.slice(0, 45)}"`,
      targetResourceId: feedback.id,
      targetResourceType: 'feedbacks',
    });
  },
  updateFeedback: async (id, feedback) => {
    const existing = get().feedbacks.find((f) => f.id === id);
    if (!existing) return;
    await setDoc(doc(db, 'feedbacks', id), cleanData({ ...existing, ...feedback }));
  },
  deleteFeedback: async (id) => {
    await deleteDoc(doc(db, 'feedbacks', id));
  },

  addSchoolDeposit: async (deposit) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...deposit, uid });
    await setDoc(doc(db, `users/${uid}/school_deposits`, deposit.id), data);
  },
  updateSchoolDeposit: async (id, deposit) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().schoolDeposits.find((d) => d.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/school_deposits`, id), cleanData({ ...existing, ...deposit, uid }));
  },
  deleteSchoolDeposit: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/school_deposits`, id));
  },
  updateSchoolAccountMeta: async (meta) => {
    const uid = auth.currentUser?.uid || get().userId;
    const existing = get().schoolAccountMeta;
    const merged = cleanData({ ...existing, ...meta });
    set({ schoolAccountMeta: merged });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('capturecrm_school_meta', JSON.stringify(merged));
        if (uid) {
          localStorage.setItem(`capturecrm_school_meta_${uid}`, JSON.stringify(merged));
        }
      } catch (e) {}
    }
    if (uid) {
      await setDoc(doc(db, `users/${uid}/school_deposits_meta`, 'account'), merged);
    }
  },

  updateSettings: async (updatedSettings) => {
    const uid = auth.currentUser?.uid || get().userId;
    const existing = get().settings;
    const merged = cleanData({ ...existing, ...updatedSettings });
    // Immediately update in-memory state so UI updates with zero lag
    set({ settings: merged });

    if (uid) {
      try {
        localStorage.setItem(`capturecrm_settings_${uid}`, JSON.stringify(merged));
      } catch (e) {}
      await setDoc(doc(db, `users/${uid}/settings`, 'profile'), merged);
    }
  },

  addSystemUser: async (user) => {
    const data = cleanData(user);
    await setDoc(doc(db, 'system_users', user.id), data);
    set((state) => ({ systemUsers: [...state.systemUsers.filter(u => u.id !== user.id), user] }));
  },

  updateSystemUser: async (id, updates) => {
    let existing = get().systemUsers.find((u) => u.id === id);
    if (!existing) {
      const legacy = get().registeredAuthUsers.find((u) => u.id === id);
      if (!legacy) return;
      existing = {
        id: legacy.id,
        email: legacy.email || '',
        displayName: legacy.email?.split('@')[0] || 'Studio User',
        role: 'photographer',
        status: 'active',
        joinedAt: legacy.lastLogin || new Date().toISOString(),
        lastActiveAt: legacy.lastLogin || new Date().toISOString(),
      };
    }
    const merged = cleanData({ ...existing, ...updates });
    await setDoc(doc(db, 'system_users', id), merged);
    set((state) => ({
      systemUsers: state.systemUsers.some((u) => u.id === id)
        ? state.systemUsers.map((u) => (u.id === id ? merged : u))
        : [...state.systemUsers, merged],
    }));
  },

  deleteSystemUser: async (id) => {
    await deleteDoc(doc(db, 'system_users', id));
    set((state) => ({ systemUsers: state.systemUsers.filter((u) => u.id !== id) }));
  },

  recordAuditLog: async (logInput) => {
    const user = auth.currentUser;
    const id = 'log_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const log: AuditLog = {
      id,
      timestamp: new Date().toISOString(),
      actorId: user?.uid || 'anonymous',
      actorEmail: user?.email || 'unknown@capturecrm.com',
      actorName: user?.displayName || user?.email?.split('@')[0] || 'User',
      category: logInput.category,
      action: logInput.action,
      description: logInput.description,
      severity: logInput.severity || 'info',
      targetResourceId: logInput.targetResourceId || '',
      targetResourceType: logInput.targetResourceType || '',
    };
    try {
      await setDoc(doc(db, 'audit_logs', id), cleanData(log));
      set((state) => ({ auditLogs: [log, ...state.auditLogs] }));
    } catch (e) {
      console.warn('Could not persist audit log:', e);
    }
  },

  addAnnouncement: async (announcementInput) => {
    const user = auth.currentUser;
    const id = 'ann_' + Math.random().toString(36).substr(2, 9);
    const announcement: SystemAnnouncement = {
      id,
      title: announcementInput.title,
      message: announcementInput.message,
      type: announcementInput.type,
      isActive: announcementInput.isActive ?? true,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || 'Super Admin',
      expiresAt: announcementInput.expiresAt || '',
    };
    await setDoc(doc(db, 'system_announcements', id), cleanData(announcement));
    set((state) => ({ announcements: [announcement, ...state.announcements] }));
  },

  updateAnnouncement: async (id, updates) => {
    const existing = get().announcements.find((a) => a.id === id);
    if (!existing) return;
    const merged = cleanData({ ...existing, ...updates });
    await setDoc(doc(db, 'system_announcements', id), merged);
    set((state) => ({ announcements: state.announcements.map(a => a.id === id ? merged : a) }));
  },

  deleteAnnouncement: async (id) => {
    await deleteDoc(doc(db, 'system_announcements', id));
    set((state) => ({ announcements: state.announcements.filter(a => a.id !== id) }));
  },
}));

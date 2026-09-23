import { create } from 'zustand';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

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
  settings: Settings;
  isSettingsLoaded: boolean;
  isAuthReady: boolean;
  userId: string | null;

  setAuthReady: (ready: boolean, userId: string | null) => void;
  setSettingsLoaded: (loaded: boolean) => void;

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

  updateSettings: (settings: Partial<Settings>) => Promise<void>;
};

const defaultSettings: Settings = {
  logoUrl: '',
  companyName: 'CaptureCRM',
  ownerName: '',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  colorScheme: 'slate',
  paymentDetails: 'Bank: Standard Chartered\nAcc Name: CaptureCRM\nAcc No: 0100000000000\nM-Pesa Till: 123456',
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
  settings: defaultSettings,
  isSettingsLoaded: false,
  isAuthReady: false,
  userId: null,

  setAuthReady: (ready, userId) => set({ isAuthReady: ready, userId }),
  setSettingsLoaded: (loaded) => set({ isSettingsLoaded: loaded }),

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
  },
  updateClient: async (id, client) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().clients.find(c => c.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/clients`, id), cleanData({ ...existing, ...client, uid }));
  },
  deleteClient: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/clients`, id));
  },

  addProject: async (project) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...project, uid });
    await setDoc(doc(db, `users/${uid}/projects`, project.id), data);
  },
  updateProject: async (id, project) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().projects.find(p => p.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/projects`, id), cleanData({ ...existing, ...project, uid }));
  },
  deleteProject: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/projects`, id));
  },

  addQuote: async (quote) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...quote, uid });
    await setDoc(doc(db, `users/${uid}/quotes`, quote.id), data);
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
  },
  updateInvoice: async (id, invoice) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().invoices.find(i => i.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/invoices`, id), cleanData({ ...existing, ...invoice, uid }));
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
  },

  addPayment: async (payment) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = cleanData({ ...payment, uid });
    await setDoc(doc(db, `users/${uid}/payments`, payment.id), data);
    
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
  },
  updateExpense: async (id, expense) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().expenses.find((e) => e.id === id);
    if (!existing) return;
    await setDoc(doc(db, `users/${uid}/expenses`, id), cleanData({ ...existing, ...expense, uid }));
  },
  deleteExpense: async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/expenses`, id));
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
  },
  updateFeedback: async (id, feedback) => {
    const existing = get().feedbacks.find((f) => f.id === id);
    if (!existing) return;
    await setDoc(doc(db, 'feedbacks', id), cleanData({ ...existing, ...feedback }));
  },
  deleteFeedback: async (id) => {
    await deleteDoc(doc(db, 'feedbacks', id));
  },

  updateSettings: async (updatedSettings) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().settings;
    await setDoc(doc(db, `users/${uid}/settings`, 'profile'), cleanData({ ...existing, ...updatedSettings }));
  },
}));

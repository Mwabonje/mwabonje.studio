import { create } from 'zustand';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  uid?: string;
};

export type CollaboratorSplit = {
  id: string;
  name: string;
  splitType: 'equal' | 'percentage';
  percentage?: number;
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  location: string;
  date: string;
  description: string;
  collaborators: CollaboratorSplit[];
  uid?: string;
};

export type LineItem = {
  id: string;
  description: string;
  price: number;
};

export type QuotePackage = {
  id: string;
  name: string;
  inclusions: string[];
  settlement: number;
};

export type Quote = {
  id: string;
  quoteNumber?: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectTitle: string;
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
  paymentDetails: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved';
  date: string;
  selectedPackages?: string[];
  revisionOf?: string;
  uid?: string;
};

export type Invoice = {
  id: string;
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
  invoiceId: string;
  amount: number;
  date: string;
  method: 'cash' | 'mpesa' | 'bank';
  reference?: string;
  uid?: string;
};

export type Settings = {
  logoUrl: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  colorScheme: string;
  paymentDetails: string;
};

type AppState = {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  settings: Settings;
  isAuthReady: boolean;
  userId: string | null;

  setAuthReady: (ready: boolean, userId: string | null) => void;

  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addQuote: (quote: Quote) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addPayment: (payment: Payment) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  updateSettings: (settings: Partial<Settings>) => Promise<void>;
};

const defaultSettings: Settings = {
  logoUrl: '',
  companyName: 'Mwabonje Studio',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  colorScheme: 'slate',
  paymentDetails: 'Bank: Standard Chartered\nAcc Name: Mwabonje Photography\nAcc No: 0100000000000\nM-Pesa Till: 123456',
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
  quotes: [],
  invoices: [],
  payments: [],
  settings: defaultSettings,
  isAuthReady: false,
  userId: null,

  setAuthReady: (ready, userId) => set({ isAuthReady: ready, userId }),

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
    await deleteDoc(doc(db, `users/${uid}/quotes`, id));
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

  updateSettings: async (updatedSettings) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const existing = get().settings;
    await setDoc(doc(db, `users/${uid}/settings`, 'profile'), cleanData({ ...existing, ...updatedSettings }));
  },
}));

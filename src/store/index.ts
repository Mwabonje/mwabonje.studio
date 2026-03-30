import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export type CollaboratorSplit = {
  id: string;
  name: string;
  splitType: 'equal' | 'percentage';
  percentage?: number; // if splitType is percentage
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  location: string;
  date: string;
  description: string;
  collaborators: CollaboratorSplit[];
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
  projectId: string; // We might still link to a project, or create one later
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
  totalAmount: number; // Sum of packages
  status: 'draft' | 'sent' | 'approved';
  date: string; // Keep for backward compatibility or use issueDate
  selectedPackages?: string[]; // IDs of selected packages
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
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'cash' | 'mpesa' | 'bank';
  reference?: string;
};

type AppState = {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];

  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      clients: [],
      projects: [],
      quotes: [],
      invoices: [],
      payments: [],

      addClient: (client) =>
        set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id, updatedClient) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updatedClient } : c
          ),
        })),
      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updatedProject) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updatedProject } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      addQuote: (quote) =>
        set((state) => ({ quotes: [...state.quotes, quote] })),
      updateQuote: (id, updatedQuote) =>
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, ...updatedQuote } : q
          ),
        })),
      deleteQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        })),

      addInvoice: (invoice) =>
        set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (id, updatedInvoice) =>
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? { ...i, ...updatedInvoice } : i
          ),
        })),
      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        })),

      addPayment: (payment) =>
        set((state) => {
          const newPayments = [...state.payments, payment];
          // Automatically update invoice balance
          const invoice = state.invoices.find((i) => i.id === payment.invoiceId);
          if (invoice) {
            const newAmountPaid = invoice.amountPaid + payment.amount;
            let newStatus: Invoice['status'] = 'unpaid';
            if (newAmountPaid >= invoice.totalAmount) {
              newStatus = 'paid';
            } else if (newAmountPaid > 0) {
              newStatus = 'partially_paid';
            }

            const newInvoices = state.invoices.map((i) =>
              i.id === invoice.id
                ? { ...i, amountPaid: newAmountPaid, status: newStatus }
                : i
            );
            return { payments: newPayments, invoices: newInvoices };
          }
          return { payments: newPayments };
        }),
      updatePayment: (id, updatedPayment) =>
        set((state) => {
          const oldPayment = state.payments.find((p) => p.id === id);
          if (!oldPayment) return state;

          const newPayments = state.payments.map((p) =>
            p.id === id ? { ...p, ...updatedPayment } : p
          );

          // If amount changed, update invoice balance
          if (updatedPayment.amount !== undefined && updatedPayment.amount !== oldPayment.amount) {
            const amountDiff = updatedPayment.amount - oldPayment.amount;
            const invoice = state.invoices.find((i) => i.id === oldPayment.invoiceId);
            
            if (invoice) {
              const newAmountPaid = invoice.amountPaid + amountDiff;
              let newStatus: Invoice['status'] = 'unpaid';
              if (newAmountPaid >= invoice.totalAmount) {
                newStatus = 'paid';
              } else if (newAmountPaid > 0) {
                newStatus = 'partially_paid';
              }

              const newInvoices = state.invoices.map((i) =>
                i.id === invoice.id
                  ? { ...i, amountPaid: newAmountPaid, status: newStatus }
                  : i
              );
              return { payments: newPayments, invoices: newInvoices };
            }
          }

          return { payments: newPayments };
        }),
      deletePayment: (id) =>
        set((state) => {
          const payment = state.payments.find((p) => p.id === id);
          if (!payment) return state;

          const newPayments = state.payments.filter((p) => p.id !== id);
          
          // Revert invoice balance
          const invoice = state.invoices.find((i) => i.id === payment.invoiceId);
          if (invoice) {
            const newAmountPaid = invoice.amountPaid - payment.amount;
            let newStatus: Invoice['status'] = 'unpaid';
            if (newAmountPaid >= invoice.totalAmount) {
              newStatus = 'paid';
            } else if (newAmountPaid > 0) {
              newStatus = 'partially_paid';
            }

            const newInvoices = state.invoices.map((i) =>
              i.id === invoice.id
                ? { ...i, amountPaid: newAmountPaid, status: newStatus }
                : i
            );
            return { payments: newPayments, invoices: newInvoices };
          }

          return { payments: newPayments };
        }),
    }),
    {
      name: 'mwabonje-storage',
    }
  )
);

import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Users,
  Receipt,
  CreditCard,
  Wallet,
  PieChart,
  Camera,
  FileSignature,
  Settings as SettingsIcon,
  Calendar,
  ChevronRight,
  Search,
  Printer,
  Sparkles,
  ShieldCheck,
  Layers,
  ExternalLink,
  Lightbulb,
  Share2,
  Download,
  Smartphone,
  Check,
  X,
  Clock,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ActionTooltip } from '@/components/ui/tooltip';

interface GuideModule {
  id: string;
  title: string;
  shortDesc: string;
  icon: React.ElementType;
  route: string;
  badge: string;
  estimatedRead: string;
  steps: {
    title: string;
    description: string;
    tips?: string[];
  }[];
  keyFeatures: string[];
  proTip: string;
}

const GUIDE_MODULES: GuideModule[] = [
  {
    id: 'studio-setup',
    title: '1. Studio Setup & Custom Branding',
    shortDesc: 'Configure your company details, studio logo, official signature, and M-Pesa / Bank accounts.',
    icon: SettingsIcon,
    route: '/settings',
    badge: 'Required First Step',
    estimatedRead: '2 min',
    steps: [
      {
        title: 'Enter Studio Details',
        description: 'Navigate to Settings to update your registered Business Name, Tagline, Studio Email, Phone Number, and Physical Address. These will automatically appear on all Quotes, Invoices, Contracts, and Receipts.',
        tips: ['Phone numbers are validated to international standards (+254 for Kenya).']
      },
      {
        title: 'Upload Brand Assets & Official Signature',
        description: 'Upload your studio logo (JPEG/PNG) and official authorized signature. Your signature is embedded onto verified contracts, NDAs, and payment receipts automatically.',
        tips: ['Use a transparent PNG or clean photo of your signature on white paper.']
      },
      {
        title: 'Configure Payment Methods',
        description: 'Set your M-Pesa details (Paybill Business Number, Account Name, or Buy Goods Till Number) and Bank Account details so clients know exactly where to send funds.',
        tips: ['Clients see these payment instructions on digital invoices and quote PDFs.']
      }
    ],
    keyFeatures: [
      'Automatic branding across all PDF exports',
      'Digital signature auto-stamping',
      'M-Pesa Till / Paybill & Bank Wire setup',
      'Customizable default terms & conditions'
    ],
    proTip: 'Completing your settings immediately elevates your studio brand from amateur to high-end professional.'
  },
  {
    id: 'clients',
    title: '2. Client Management',
    shortDesc: 'Maintain a single source of truth for all corporate, wedding, and portrait clients.',
    icon: Users,
    route: '/clients',
    badge: 'Core Directory',
    estimatedRead: '2 min',
    steps: [
      {
        title: 'Add New Client Profile',
        description: 'Click "+ Add Client" to record company or individual name, email, phone number, and physical or billing address.',
        tips: ['Include specific preferences or dietary notes for event shoot days in the notes field.']
      },
      {
        title: 'Track Client History & Projects',
        description: 'Each client profile displays all past and ongoing quotes, projects, and invoices associated with them in one consolidated view.',
      },
      {
        title: 'Export Client Directory',
        description: 'Use the "Export CSV" button to download your entire client roster for marketing emails or accounting audits.',
      }
    ],
    keyFeatures: [
      'Quick search by client name, email, or phone',
      'Direct link to client project history',
      'CSV data export with one click',
      'Phone formatting and WhatsApp compatibility'
    ],
    proTip: 'Add clients before creating quotes to enable quick auto-complete and linked record management.'
  },
  {
    id: 'quotes',
    title: '3. Quotes & Price Estimates',
    shortDesc: 'Build itemized estimates, share digital preview links, and track approval states.',
    icon: FileText,
    route: '/quotes',
    badge: 'Sales Engine',
    estimatedRead: '3 min',
    steps: [
      {
        title: 'Create a Professional Quote',
        description: 'Click "+ New Quote", choose an existing client or enter new details, select the shoot date, and add line items (e.g., Full-day Coverage, Drone Videography, Photo Editing, Drone Pilot fee).',
        tips: ['Include item descriptions and quantities to prevent client scope creep later.']
      },
      {
        title: 'Set Expiry Date & Deposit Requirements',
        description: 'Set an estimate expiry date (e.g., 14 days) and specify the upfront deposit percentage (e.g., 50%). Quotes calculate subtotal, discount, VAT/tax, and deposit requirements automatically.',
      },
      {
        title: 'Share Digital Preview or Download PDF',
        description: 'Use the "Share" button to copy a client-facing web link (`/quote/shared?id=...`). The client can view the interactive estimate online, download a branded PDF, or request changes.',
        tips: ['Shared quotes display your studio branding and allow clients to review without creating an account.']
      },
      {
        title: 'One-Click Invoice Conversion on Approval',
        description: 'Once the client agrees, click the green "Approve & Create Invoice" checkmark button. This instantly converts the approved quote into an active invoice with deposit and balance amounts preserved!',
      }
    ],
    keyFeatures: [
      'Line item templates and automatic subtotal/tax calculations',
      'Public client review portal with no login needed',
      'Direct links to generate Service Contracts and NDAs',
      'Instant conversion into official Invoices upon approval'
    ],
    proTip: 'Generate and attach the Contract/NDA directly from the quote row before the client signs off.'
  },
  {
    id: 'contracts',
    title: '4. Legal Contracts & NDAs',
    shortDesc: 'Protect your studio with legally compliant Service Agreements and Non-Disclosure Agreements.',
    icon: FileSignature,
    route: '/contracts',
    badge: 'Legal Protection',
    estimatedRead: '3 min',
    steps: [
      {
        title: 'Select Quote or Project to Generate Agreement',
        description: 'Open the Contracts page or click the "Contract" / "NDA" button directly from any Quote. All client details, shoot dates, deliverables, and payment amounts are automatically populated.',
      },
      {
        title: 'Service Agreement (Contract) Scope',
        description: 'Covers shoot schedule, creative discretion, cancellation policies, delivery timelines, payment terms, and copyright/usage licenses.',
        tips: ['Pre-configured with standard photography industry protection clauses.']
      },
      {
        title: 'Non-Disclosure Agreement (NDA)',
        description: 'Essential for VIP, corporate product launches, and private celebrity weddings. Specifies confidentiality duration and intellectual property ownership.',
      },
      {
        title: 'Digital Signing & Export',
        description: 'Preview the agreement in real-time, embed your verified studio signature, print directly or download high-resolution PDF copies for client countersigning.',
      }
    ],
    keyFeatures: [
      'Dynamic variable injection (Client, Studio, Shoot Dates, Fee)',
      'Side-by-side tabs for Service Contracts and NDAs',
      'Print-ready format with signature lines and stamps',
      'Quick navigation back to source quote'
    ],
    proTip: 'Never attend a shoot without an approved Service Agreement and agreed deposit in place.'
  },
  {
    id: 'invoices',
    title: '5. Invoices & Billing Management',
    shortDesc: 'Issue professional invoices with deposit tracking, due dates, and shareable payment links.',
    icon: Receipt,
    route: '/invoices',
    badge: 'Revenue Collection',
    estimatedRead: '3 min',
    steps: [
      {
        title: 'Generate or Review Invoices',
        description: 'Invoices created from approved quotes are automatically populated. You can also click "+ New Invoice" to bill clients directly for ad-hoc services, extra editing hours, or prints.',
      },
      {
        title: 'Track Payment Progress (Unpaid, Partial, Paid)',
        description: 'Invoices dynamically reflect payments received against them. When a deposit is logged, the invoice status changes to "Partially Paid", showing the remaining balance due.',
      },
      {
        title: 'Share Digital Invoice Link',
        description: 'Click "Copy Link" to send the direct invoice URL (`/invoice/shared?id=...`) via WhatsApp or Email. Clients can see payment instructions (M-Pesa Paybill, Till, Bank wire) right on their screen.',
      },
      {
        title: 'Download & Print Branded Invoices',
        description: 'Download PDF copies formatted with formal invoice numbering (e.g., INV-0042), tax breakdown, payment instructions, and official stamp.',
      }
    ],
    keyFeatures: [
      'Automatic deposit vs balance calculation',
      'Overdue tracking based on shoot/due date',
      'Client-facing interactive invoice view with live status',
      'Direct link to log payment received'
    ],
    proTip: 'Send the digital invoice link via WhatsApp alongside the quote for rapid payment confirmation.'
  },
  {
    id: 'payments',
    title: '6. Payment Logging & Official Receipts',
    shortDesc: 'Log M-Pesa confirmation codes, card, or cash payments and generate verifiable receipts.',
    icon: CreditCard,
    route: '/payments',
    badge: 'Cashflow & Proof',
    estimatedRead: '2 min',
    steps: [
      {
        title: 'Record a Payment',
        description: 'Click "+ Log Payment", select the client and corresponding invoice. Enter the amount paid, payment date, and method (M-Pesa, Bank Transfer, Card, Cash).',
      },
      {
        title: 'Enter M-Pesa Transaction Code',
        description: 'For M-Pesa transactions, input the 10-character reference code (e.g. QKH7892KLM). This is permanently stamped onto the official payment receipt for fraud prevention.',
        tips: ['Verification codes build immediate trust with corporate accounts and wedding clients.']
      },
      {
        title: 'Generate Official PDF Receipt',
        description: 'Click the "Preview" or "Download" receipt button on any payment row. The system creates a formal receipt containing a verification QR code, studio signature, and transaction breakdown.',
      }
    ],
    keyFeatures: [
      'Permanent M-Pesa reference code recording',
      'Verifiable QR code on official PDF receipts',
      'Auto-updates invoice remaining balance',
      'Full audit trail of historical transactions'
    ],
    proTip: 'Send the official receipt to your client immediately after verifying their M-Pesa message.'
  },
  {
    id: 'projects-splits',
    title: '7. Projects & Collaborator Revenue Splits',
    shortDesc: 'Manage shoot execution, assign crew (shooters, editors), and calculate team revenue shares.',
    icon: Briefcase,
    route: '/projects',
    badge: 'Crew & Production',
    estimatedRead: '3 min',
    steps: [
      {
        title: 'Create & Organize Projects',
        description: 'Projects track shoot dates, locations, status (Inquiry, Booked, In Progress, Delivered), and client deliverables (e.g., 300 edited photos, highlight video).',
      },
      {
        title: 'Assign Team Collaborators',
        description: 'Open the "Collaborator Split" dialog on any project. Add your crew members (Lead Photographer, 2nd Shooter, Drone Pilot, Lead Editor, Lighting Assistant).',
      },
      {
        title: 'Calculate Revenue Shares (% or Fixed KES)',
        description: 'Specify each collaborator\'s split as a percentage of project revenue or a flat fee. The system calculates net studio retained profit vs total team payouts.',
        tips: ['Save recurring crew allocations as "Project Templates" to apply them in one click!']
      },
      {
        title: 'Track Payout Status',
        description: 'Mark each team member as "Pending", "Approved", or "Paid" as funds are disbursed, ensuring nobody is forgotten after delivery.',
      }
    ],
    keyFeatures: [
      'Visual timeline and status indicators for shoots',
      'Automatic revenue split math (% or flat amounts)',
      'Custom reusable crew templates for quick assignment',
      'Studio profit margin visibility after crew payouts'
    ],
    proTip: 'Use Project Templates for your standard packages (e.g. "Full Wedding: 2 Shooters + 1 Editor") to save time.'
  },
  {
    id: 'expenses',
    title: '8. Expenses & Maintenance Reminders',
    shortDesc: 'Track studio operational costs, gear rentals, travel, and set renewal alerts.',
    icon: Wallet,
    route: '/expenses',
    badge: 'Cost Control',
    estimatedRead: '2 min',
    steps: [
      {
        title: 'Log Studio Expenses',
        description: 'Record studio rent, fuel, gear maintenance, drone flight permits, software subscriptions, or freelance payments.',
      },
      {
        title: 'M-Pesa Reference & Vendor Tracking',
        description: 'Tag common photography vendors and input M-Pesa payment codes for instant reconciliation.',
      },
      {
        title: 'Set License & Equipment Reminders',
        description: 'Configure reminders for equipment insurance renewals, drone pilot licenses, domain expiries, and tax filing deadlines with email/dashboard popups.',
      }
    ],
    keyFeatures: [
      'Category-wise expenditure visual charts',
      'M-Pesa transaction reference recording',
      'Automated popup alerts for upcoming renewals',
      'Net profit deductions calculated in real time'
    ],
    proTip: 'Log fuel and catering expenses immediately after returning from an offsite shoot while receipts are fresh.'
  },
  {
    id: 'equipment',
    title: '9. Equipment Inventory Management',
    shortDesc: 'Catalog cameras, lenses, drones, lighting, serial numbers, and asset value.',
    icon: Camera,
    route: '/equipment',
    badge: 'Asset Security',
    estimatedRead: '2 min',
    steps: [
      {
        title: 'Register Equipment Items',
        description: 'Click "+ Add Equipment" to catalog camera bodies, prime lenses, flashes, audio mics, and tripods.',
      },
      {
        title: 'Store Serial Numbers & Purchase Value',
        description: 'Keep record of factory serial numbers and purchase prices. In the event of theft or police inquiry, this record is essential for insurance claims.',
      },
      {
        title: 'Monitor Condition Status',
        description: 'Flag items as "Good", "Needs Repair", "In Service", or "Decommissioned" to ensure no faulty gear is packed for shoot day.',
      }
    ],
    keyFeatures: [
      'Serial number lookup for insurance and travel permits',
      'Total gear asset portfolio valuation',
      'Condition tracking to schedule timely servicing',
      'Exportable CSV inventory list'
    ],
    proTip: 'Print or export your equipment inventory before traveling through airport customs to prove ownership.'
  },
  {
    id: 'performance',
    title: '10. Performance Analytics & Reports',
    shortDesc: 'Review monthly revenue, net profit margins, top clients, and financial health.',
    icon: PieChart,
    route: '/performance',
    badge: 'Business Insights',
    estimatedRead: '2 min',
    steps: [
      {
        title: 'Review Revenue vs Expenses',
        description: 'Examine monthly and annual financial performance curves showing gross bookings, operational expenses, and net profit.',
      },
      {
        title: 'Analyze Best Revenue Streams',
        description: 'Identify your most lucrative photography genres (e.g. Corporate vs Weddings) and high-value repeat clients.',
      },
      {
        title: 'Export Financial Summary',
        description: 'Export clean CSV reports for your accountant or tax filings with all calculations pre-formatted.',
      }
    ],
    keyFeatures: [
      'Interactive monthly and yearly revenue charts',
      'Net profit margin indicators',
      'Breakdown of outstanding invoices vs collected revenue',
      'Complete fiscal CSV export'
    ],
    proTip: 'Review your performance at the start of each month to set realistic booking targets.'
  }
];

const FAQS = [
  {
    q: 'How do I send a quote to a client who does not have an account?',
    a: 'Simply click the "Share" or "Preview" icon on any quote row in the Quotes manager, and copy the link. The client can open this link on their smartphone or laptop without needing to log in. They can review all items and download the PDF directly.'
  },
  {
    q: 'What happens when a client approves an estimate?',
    a: 'Click the green "Approve & Create Invoice" checkmark button on the quote row. CaptureCRM automatically updates the quote status to Approved and creates a corresponding Invoice with matching deposit terms, line items, and client details.'
  },
  {
    q: 'How does collaborator revenue splitting work?',
    a: 'In the Projects page, click the "Collaborator Split" pie-chart button on any project. You can add photographers, videographers, or editors and assign them either a percentage of project total or a flat fee (KES). The system tallies collaborator payouts and shows your remaining studio profit.'
  },
  {
    q: 'Can I generate a Contract or NDA before the invoice is paid?',
    a: 'Yes! Service Contracts and Non-Disclosure Agreements can be generated at any stage directly from the Quotes page or the Contracts page. They auto-fill the client\'s name, shoot date, studio information, and deliverables.'
  },
  {
    q: 'Where do I customize my M-Pesa Paybill / Till Number?',
    a: 'Head to the Settings page. Under "Payment Information", you can configure your M-Pesa Business Number, Account Name, Till Number, and Bank details. These details automatically render on all generated invoices and receipts.'
  },
  {
    q: 'Are official receipts generated with M-Pesa transaction codes?',
    a: 'Yes. When recording a payment in Payments, enter the M-Pesa reference code (e.g. QK89A12B). CaptureCRM embeds this reference code along with an official verification QR code and your digital signature on the PDF receipt.'
  }
];

export function ManualGuide() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('studio-setup');
  const [isTourOpen, setIsTourOpen] = useState(searchParams.get('tour') === 'true');
  const [tourStep, setTourStep] = useState(0);

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return GUIDE_MODULES;
    const term = searchTerm.toLowerCase();
    return GUIDE_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.shortDesc.toLowerCase().includes(term) ||
        m.keyFeatures.some((f) => f.toLowerCase().includes(term)) ||
        m.steps.some(
          (s) =>
            s.title.toLowerCase().includes(term) ||
            s.description.toLowerCase().includes(term)
        )
    );
  }, [searchTerm]);

  const activeModule = useMemo(() => {
    return (
      GUIDE_MODULES.find((m) => m.id === selectedModule) || GUIDE_MODULES[0]
    );
  }, [selectedModule]);

  const tourSteps = [
    {
      title: 'Welcome to CaptureCRM',
      subtitle: 'The Complete Operating System for High-End Photography Studios',
      content:
        'CaptureCRM manages the entire commercial photography lifecycle: from initial client inquiry and price quotes, to legal contracts, invoices, M-Pesa payment receipts, crew revenue splits, and equipment inventory.',
      icon: Sparkles,
      actionText: 'Next: Core Workflow',
    },
    {
      title: 'Step 1: Set Up Studio Branding',
      subtitle: 'Settings & Payment Configuration',
      content:
        'Before issuing your first estimate, visit Settings to input your Studio Name, official logo, digital signature, and M-Pesa / Bank details. These will appear on all your official client documents.',
      icon: SettingsIcon,
      link: '/settings',
      linkText: 'Open Settings',
      actionText: 'Next: Quotes & Pricing',
    },
    {
      title: 'Step 2: Quotes, Contracts & NDAs',
      subtitle: 'Itemized Pricing & Legal Protection',
      content:
        'Build line-item estimates in Quotes. Before shooting, generate an automated Service Contract or Non-Disclosure Agreement (NDA) with your client with one click.',
      icon: FileSignature,
      link: '/quotes',
      linkText: 'Explore Quotes',
      actionText: 'Next: Invoicing & M-Pesa',
    },
    {
      title: 'Step 3: Invoicing & Payment Receipts',
      subtitle: 'Deposit Tracking & Verifiable Receipts',
      content:
        'When a client approves a quote, convert it to an Invoice with one click. Log M-Pesa or bank payments to generate verified PDF receipts featuring security QR codes and transaction codes.',
      icon: CreditCard,
      link: '/payments',
      linkText: 'View Payments',
      actionText: 'Next: Crew Revenue Splits',
    },
    {
      title: 'Step 4: Crew Revenue Splits',
      subtitle: 'Projects & Collaborators',
      content:
        'Managing second shooters, videographers, or photo editors? Use Collaborator Splits on any project to calculate percentage or flat-fee payouts and track payment status.',
      icon: Users,
      link: '/projects',
      linkText: 'Check Projects',
      actionText: 'Next: Business Health',
    },
    {
      title: 'Step 5: Expenses, Inventory & Reports',
      subtitle: 'Full Financial Control',
      content:
        'Track equipment serial numbers and maintenance in Equipment Inventory. Log shoot travel and studio expenses in Expenses, and check your net profit margins in Performance.',
      icon: PieChart,
      link: '/performance',
      linkText: 'View Performance',
      actionText: 'Complete Tour & Start Using App',
    },
  ];

  const handlePrintManual = () => {
    window.print();
  };

  const openTour = () => {
    setTourStep(0);
    setIsTourOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-primary text-primary-foreground rounded-lg shadow-sm">
              <BookOpen className="w-5 h-5 text-accent" />
            </span>
            <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/60 uppercase tracking-widest text-[11px] font-semibold">
              System Documentation & Guide
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            CaptureCRM User Manual & Guide
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            A comprehensive, step-by-step walkthrough of how CaptureCRM streamlines client communication, automated quotes, legal contracts, invoicing, M-Pesa receipts, and crew revenue splits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <ActionTooltip content="Launch interactive 5-step system tour">
            <Button
              onClick={openTour}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Quick-Start Tour
            </Button>
          </ActionTooltip>

          <ActionTooltip content="Print or save manual as PDF">
            <Button
              onClick={handlePrintManual}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Guide
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* Visual System Pipeline / Lifecycle Stepper */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                End-to-End Studio Workflow Pipeline
              </CardTitle>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Click any stage below to jump directly to its instructions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[760px] gap-2">
            {[
              { id: 'clients', label: '1. Client Profile', icon: Users, sub: 'Inquiry & Details' },
              { id: 'quotes', label: '2. Quote & Pricing', icon: FileText, sub: 'Line Items & Terms' },
              { id: 'contracts', label: '3. Legal Contract', icon: FileSignature, sub: 'Service Agreement & NDA' },
              { id: 'invoices', label: '4. Invoice Issued', icon: Receipt, sub: 'Deposit & Balance' },
              { id: 'payments', label: '5. M-Pesa Receipt', icon: CreditCard, sub: 'Code & Verified QR' },
              { id: 'projects-splits', label: '6. Shoot & Split', icon: Briefcase, sub: 'Crew Revenue %' },
              { id: 'performance', label: '7. Net Profit', icon: PieChart, sub: 'Analytics & Growth' },
            ].map((stage, idx, arr) => {
              const Icon = stage.icon;
              const isSelected = selectedModule === stage.id;
              return (
                <React.Fragment key={stage.id}>
                  <button
                    onClick={() => setSelectedModule(stage.id)}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all cursor-pointer group flex-1 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-primary-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap">{stage.label}</span>
                    <span className={`text-[10px] mt-0.5 whitespace-nowrap ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {stage.sub}
                    </span>
                  </button>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Interactive Guide Layout: Sidebar list + Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Search + Module Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search guide (e.g. M-Pesa, Contract, Split)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredModules.length === 0 ? (
              <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-dashed text-muted-foreground text-xs">
                No matching topics found for "{searchTerm}".
              </div>
            ) : (
              filteredModules.map((module) => {
                const Icon = module.icon;
                const isSelected = selectedModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3 border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-slate-800 text-accent'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {module.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {module.estimatedRead}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {module.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Help Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 border-amber-200 dark:border-slate-700">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-semibold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                First Time Pro-Tip
              </div>
              <p className="text-xs text-amber-800 dark:text-slate-300 leading-relaxed">
                Before booking shoots, always ensure your <strong>Settings</strong> contain your official studio logo and M-Pesa details. That way, any quote or contract you generate is immediately client-ready.
              </p>
              <Link to="/settings" className="inline-flex items-center text-xs font-bold text-amber-900 dark:text-amber-400 hover:underline pt-1">
                Go to Settings <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Selected Module In-Depth Guide */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium text-[11px]">
                      {activeModule.badge}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {activeModule.estimatedRead} read
                    </span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {activeModule.title}
                  </CardTitle>
                </div>
                <Link to={activeModule.route}>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Open {activeModule.title.split('. ')[1] || 'Module'} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                {activeModule.shortDesc}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Step-by-Step Instructions */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Step-by-Step Instructions
                </h3>

                <div className="space-y-4">
                  {activeModule.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {step.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.description}
                        </p>
                        {step.tips && step.tips.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {step.tips.map((tip, tIdx) => (
                              <div key={tIdx} className="flex items-center text-xs text-primary dark:text-accent font-medium">
                                <Check className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features & Pro Tip Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Key Capabilities
                  </h4>
                  <ul className="space-y-2">
                    {activeModule.keyFeatures.map((feat, idx) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-slate-900 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-accent flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Studio Pro-Tip
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    "{activeModule.proTip}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick FAQ Accordion */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Frequently Asked Questions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-slate-100 dark:divide-slate-800">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-start gap-2">
                    <span className="text-primary font-bold">Q:</span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-5 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Quick-Start Tour Modal */}
      <Dialog open={isTourOpen} onOpenChange={setIsTourOpen}>
        <DialogContent className="sm:max-w-[580px] p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-medium">
                Step {tourStep + 1} of {tourSteps.length}
              </Badge>
              <span className="text-xs text-muted-foreground">CaptureCRM Guided Tour</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              {React.createElement(tourSteps[tourStep].icon, { className: 'w-6 h-6 text-primary' })}
              {tourSteps[tourStep].title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              {tourSteps[tourStep].subtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {tourSteps[tourStep].content}
            </p>

            {tourSteps[tourStep].link && (
              <div className="pt-1">
                <Link
                  to={tourSteps[tourStep].link!}
                  onClick={() => setIsTourOpen(false)}
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                >
                  {tourSteps[tourStep].linkText} <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            )}

            {/* Progress indicators */}
            <div className="flex items-center gap-1.5 pt-2">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === tourStep
                      ? 'w-8 bg-primary'
                      : idx < tourStep
                      ? 'w-3 bg-primary/40'
                      : 'w-3 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              disabled={tourStep === 0}
              onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
              className="text-slate-600 hover:text-slate-900"
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTourOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (tourStep < tourSteps.length - 1) {
                    setTourStep((prev) => prev + 1);
                  } else {
                    setIsTourOpen(false);
                  }
                }}
              >
                {tourStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ManualGuide;

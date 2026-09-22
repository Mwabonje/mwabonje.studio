import { PDFLoader } from "@/components/PDFLoader";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore, Quote, QuotePackage, QuoteDeliverableTask } from "@/store";
import { NDA } from "@/components/NDA";
import { Contract } from "@/components/Contract";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,

  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Send,
  User,
  FileSignature,
  Package,
  StickyNote,
  ShieldCheck,
  FileCheck2,
  ExternalLink,
  Link as LinkIcon,
  CheckSquare,
  Copy,
  Eye,
  XCircle,
  Download,
  History,
  RotateCcw,
  Loader2,
  Clock,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { ActionTooltip } from "@/components/ui/tooltip";

const checkIsExpired = (quote: any) => {
  if (quote.status === 'approved' || quote.status === 'declined') return false;
  
  const validityString = quote.quoteValidity || "7 days";
  const daysMatch = validityString.match(/(\d+)\s*days?/i);
  if (!daysMatch) return false;
  
  const days = parseInt(daysMatch[1], 10);
  const issueDateStr = quote.issueDate || quote.date;
  if (!issueDateStr) return false;
  
  const issueDate = new Date(issueDateStr);
  const expiryDate = new Date(issueDate.getTime() + days * 24 * 60 * 60 * 1000);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  return now > expiryDate;
};
import { getResolvedTheme } from '@/lib/theme';
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

export function Quotes() {
  const quoteRef = useRef<HTMLDivElement>(null);
  
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const editingQuoteRef = useRef<Quote | null>(null);

  const {
    quotes,
    clients,
    projects,
    invoices,
    settings,
    addQuote,
    updateQuote,
    deleteQuote,
    addClient,
    updateClient,
    addProject,
    updateProject,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewQuote, setActivePreviewQuote] = useState<Quote | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isNDADialogOpen, setIsNDADialogOpen] = useState(false);
  const [quoteForNDA, setQuoteForNDA] = useState<Quote | null>(null);
  const [isGeneratingNDAPDF, setIsGeneratingNDAPDF] = useState(false);
  const [isNDAAutoSigned, setIsNDAAutoSigned] = useState(false);
  const ndaRef = useRef<HTMLDivElement>(null);
  
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [quoteForContract, setQuoteForContract] = useState<Quote | null>(null);
  const [isGeneratingContractPDF, setIsGeneratingContractPDF] = useState(false);
  const [isContractAutoSigned, setIsContractAutoSigned] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [quoteToApprove, setQuoteToApprove] = useState<Quote | null>(null);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [depositPercentage, setDepositPercentage] = useState<number>(65);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  useEffect(() => {
    editingQuoteRef.current = editingQuote;
  }, [editingQuote]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionVersions, setSessionVersions] = useState<{
    id: string;
    timestamp: Date;
    label: string;
    data: { formData: any; packages: any; deliverableTasks: any };
  }[]>([]);
  const lastCaptureRef = useRef<number>(0);
  
  const revertToVersion = (version: any) => {
    if (window.confirm("Are you sure you want to revert to this version? Any unsaved changes since will be overwritten.")) {
      setFormData(version.data.formData);
      setPackages(version.data.packages);
      setDeliverableTasks(version.data.deliverableTasks);
      toast.success("Reverted to previous version");
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "approve" | "decline" | "link" | "duplicate" | "edit" | "nda";
    quote: Quote;
  } | null>(null);

  const OLD_SELECTION_STORAGE_TEXTS = [
    "Client selections must be made within 14 days of receiving the proof gallery. Storage of final files is guaranteed for 6 months after delivery.",
    "Clients are required to submit their image selections within 10 days of receiving the proof gallery. Projects without a response after 10 days will be placed on hold and rescheduled based on the photographer's current workload. If the project remains inactive for more than 21 days, a KSh 1,000 Project Reactivation Fee will be charged before work resumes."
  ];

  const defaultFormData = {
    quoteNumber: "",
    projectId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientNationality: "",
    clientLeadSource: "",
    projectTitle: "",
    location: "",
    shootingTime: "",
    photographers: "",
    issueDate: format(new Date(), "yyyy-MM-dd"),
    quoteValidity: "This quotation is valid for 7 days from the date issued.",
    eventDate: "",
    moodboardLink: "",
    note: "",
    hasCommercialLicense: false,
    retainerClause:
      "Payment is split as follows: 50% retainer to confirm your booking, 45% on the day of the shoot, and the final 5% on delivery of your edited gallery.",
    fulfillmentSchedule:
      "High-resolution digital files delivered via online gallery within 2-3 business days of the shoot.",
    usageLicense:
      "Personal and social media sharing included. Commercial licensing available on request.",
    usageRights:
      "Mwabonje Photography retains copyright. Selected images/videos may be used for portfolio purposes unless privacy is requested. RAW files are not included and are only available as an add-on (Ksh 5,000) alongside a booked package.",
    transportLogistics:
      "Transport for both locations is included. Transport outside the mentioned locations will be billed at cost.",
    cancellationRescheduling:
      "Cancellation by client: deposit is non-refundable. Rescheduling: minimum 72 hours' notice, subject to availability. Cancellation by photographer: full refund of all payments made.",
    weatherConditions: "Mwabonje Photography shall not be held liable for delays, rescheduling, or failure to deliver services due to circumstances beyond reasonable control. These include, but are not limited to, extreme weather conditions, acts of God, government restrictions, illness, equipment failure, or other unforeseen events. In such cases, both parties will work together in good faith to reschedule the session or agree on a fair solution.",
    selectionAndStorage: "Clients are required to submit their image selections within 10 days of receiving the proof gallery. Projects without a response after 10 days will be placed on hold and rescheduled based on the photographer's current workload. If the project remains inactive for more than 21 days, a Project Reactivation Fee will apply before work resumes as follows: KSh 3,000 for projects inactive for 22–60 days, KSh 5,000 for 61–90 days, and KSh 7,000 for projects inactive for more than 90 days, subject to file availability.",
    paymentDetails: settings.paymentDetails,
    status: "draft" as Quote["status"],
    date: format(new Date(), "yyyy-MM-dd"),
    revisionOf: undefined as string | undefined,
    isCollaboration: false,
    collaborationCut: 0,
    collaborationType: "percentage" as "percentage" | "fixed",
    deliverablesSubTitle: "",
    deliverablesTitle: "",
    deliverablesPrice: "",
    deliverablesNote: "",
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [packages, setPackages] = useState<QuotePackage[]>([]);
  const [deliverableTasks, setDeliverableTasks] = useState<
    QuoteDeliverableTask[]
  >([]);

  const generateQuoteNumber = () => {
    let maxNum = 0;
    quotes.forEach((q) => {
      if (q.quoteNumber && q.quoteNumber.startsWith("QT-")) {
        const parts = q.quoteNumber.split("-");
        if (parts.length >= 2) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    return `QT-${String(maxNum + 1).padStart(4, "0")}`;
  };

  const generateRevisionNumber = (originalQuote: Quote) => {
    const baseNumber =
      originalQuote.quoteNumber ||
      `QT-${originalQuote.id.substring(0, 8).toUpperCase()}`;
    const baseWithoutRev = baseNumber.replace(/-R\d+$/, "");

    let maxRev = 0;
    quotes.forEach((q) => {
      if (q.quoteNumber && q.quoteNumber.startsWith(`${baseWithoutRev}-R`)) {
        const revPart = q.quoteNumber.split("-R")[1];
        if (revPart) {
          const num = parseInt(revPart, 10);
          if (!isNaN(num) && num > maxRev) {
            maxRev = num;
          }
        }
      }
    });
    return `${baseWithoutRev}-R${maxRev + 1}`;
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      slate: "bg-slate-900",
      blue: "bg-blue-900",
      green: "bg-green-900",
      rose: "bg-rose-900",
      amber: "bg-amber-900",
      violet: "bg-violet-900",
    };
    return colors[color] || "bg-slate-900";
  };

  const handleOpenDialog = (quote?: Quote) => {
    if (quote) {
      setEditingQuote(quote);
      
      const savedDraft = localStorage.getItem(`quoteDraft_${quote.id}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed.formData || {
            quoteNumber: quote.quoteNumber || "",
            projectId: quote.projectId || "",
            clientName: quote.clientName || "",
            clientEmail: quote.clientEmail || "",
            clientPhone: quote.clientPhone || "",
            clientNationality: quote.clientNationality || "",
            clientLeadSource: quote.clientLeadSource || "",
            projectTitle: quote.projectTitle || "",
            location: quote.location || "",
            shootingTime: quote.shootingTime || "",
            photographers: quote.photographers || "",
            issueDate: quote.issueDate || quote.date || format(new Date(), "yyyy-MM-dd"),
            quoteValidity: quote.quoteValidity !== undefined ? quote.quoteValidity : defaultFormData.quoteValidity,
            eventDate: quote.eventDate || "",
            moodboardLink: quote.moodboardLink || "",
            note: quote.note || "",
            hasCommercialLicense: quote.hasCommercialLicense || false,
            retainerClause: quote.retainerClause || defaultFormData.retainerClause,
            fulfillmentSchedule: quote.fulfillmentSchedule || defaultFormData.fulfillmentSchedule,
            usageLicense: quote.usageLicense || defaultFormData.usageLicense,
            usageRights: quote.usageRights || defaultFormData.usageRights,
            transportLogistics: quote.transportLogistics || defaultFormData.transportLogistics,
            cancellationRescheduling: quote.cancellationRescheduling || defaultFormData.cancellationRescheduling,
            weatherConditions: quote.weatherConditions !== undefined ? quote.weatherConditions : defaultFormData.weatherConditions,
            selectionAndStorage: quote.selectionAndStorage !== undefined && !OLD_SELECTION_STORAGE_TEXTS.includes(quote.selectionAndStorage) ? quote.selectionAndStorage : defaultFormData.selectionAndStorage,
            paymentDetails: quote.paymentDetails || defaultFormData.paymentDetails,
            status: quote.status,
            date: quote.date,
            revisionOf: quote.revisionOf,
            isCollaboration: quote.isCollaboration || false,
            collaborationCut: quote.collaborationCut || 0,
            collaborationType: quote.collaborationType || "percentage",
            deliverablesSubTitle: quote.deliverablesSubTitle || "",
            deliverablesTitle: quote.deliverablesTitle || "",
            deliverablesPrice: quote.deliverablesPrice?.toString() || "",
            deliverablesNote: quote.deliverablesNote || "",
          });
          setPackages(parsed.packages || quote.packages || []);
          setDeliverableTasks(parsed.deliverableTasks || quote.deliverableTasks || []);
        } catch (e) {
          console.error("Failed to parse quote draft", e);
        }
      } else {
        setFormData({
          quoteNumber: quote.quoteNumber || "",
          projectId: quote.projectId || "",
          clientName: quote.clientName || "",
          clientEmail: quote.clientEmail || "",
          clientPhone: quote.clientPhone || "",
          clientNationality: quote.clientNationality || "",
          clientLeadSource: quote.clientLeadSource || "",
          projectTitle: quote.projectTitle || "",
          location: quote.location || "",
          shootingTime: quote.shootingTime || "",
          photographers: quote.photographers || "",
          issueDate:
            quote.issueDate || quote.date || format(new Date(), "yyyy-MM-dd"),
          eventDate: quote.eventDate || "",
          moodboardLink: quote.moodboardLink || "",
          note: quote.note || "",
          hasCommercialLicense: quote.hasCommercialLicense || false,
          retainerClause: quote.retainerClause || defaultFormData.retainerClause,
          fulfillmentSchedule:
            quote.fulfillmentSchedule || defaultFormData.fulfillmentSchedule,
          usageLicense: quote.usageLicense || defaultFormData.usageLicense,
          usageRights: quote.usageRights || defaultFormData.usageRights,
          transportLogistics:
            quote.transportLogistics || defaultFormData.transportLogistics,
          cancellationRescheduling:
            quote.cancellationRescheduling ||
            defaultFormData.cancellationRescheduling,
          weatherConditions: quote.weatherConditions !== undefined ? quote.weatherConditions : defaultFormData.weatherConditions,
          selectionAndStorage: quote.selectionAndStorage !== undefined && !OLD_SELECTION_STORAGE_TEXTS.includes(quote.selectionAndStorage) ? quote.selectionAndStorage : defaultFormData.selectionAndStorage,
          paymentDetails: quote.paymentDetails || defaultFormData.paymentDetails,
          status: quote.status,
          date: quote.date,
          revisionOf: quote.revisionOf,
          isCollaboration: quote.isCollaboration || false,
          collaborationCut: quote.collaborationCut || 0,
          collaborationType: quote.collaborationType || "percentage",
          deliverablesSubTitle: quote.deliverablesSubTitle || "",
          deliverablesTitle: quote.deliverablesTitle || "",
          deliverablesPrice: quote.deliverablesPrice?.toString() || "",
          deliverablesNote: quote.deliverablesNote || "",
        });
        setPackages(quote.packages || []);
        setDeliverableTasks(quote.deliverableTasks || []);
      }
    } else {
      setEditingQuote(null);
      const savedDraft = localStorage.getItem("quoteDraft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          let draftedData = parsed.formData;
          if (draftedData && OLD_SELECTION_STORAGE_TEXTS.includes(draftedData.selectionAndStorage)) {
             draftedData.selectionAndStorage = defaultFormData.selectionAndStorage;
          }
          setFormData(draftedData || {
            ...defaultFormData,
            quoteNumber: generateQuoteNumber(),
          });
          setPackages(parsed.packages || []);
          setDeliverableTasks(parsed.deliverableTasks || []);
        } catch (e) {
          setFormData({
            ...defaultFormData,
            quoteNumber: generateQuoteNumber(),
          });
          setPackages([]);
          setDeliverableTasks([]);
        }
      } else {
        setFormData({
          ...defaultFormData,
          quoteNumber: generateQuoteNumber(),
        });
        setPackages([]);
        setDeliverableTasks([]);
      }
    }
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('new') === 'true') {
      handleOpenDialog();
    }
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      isFirstRender.current = true;
      setAutoSaveStatus('idle');
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setShowHistory(false);
      setSessionVersions([]);
      lastCaptureRef.current = 0;
      return;
    }

    // Keep the local storage draft backup synchronously
    const draft = { formData, packages, deliverableTasks };
    if (editingQuoteRef.current) {
      localStorage.setItem(`quoteDraft_${editingQuoteRef.current.id}`, JSON.stringify(draft));
    } else {
      localStorage.setItem("quoteDraft", JSON.stringify(draft));
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Capture initial state for version history
      setSessionVersions([{
        id: crypto.randomUUID(),
        timestamp: new Date(),
        label: "Initial Version (Opened)",
        data: JSON.parse(JSON.stringify(draft)) // deep copy
      }]);
      lastCaptureRef.current = Date.now();
      
      return; // Do not auto-save to DB on the very first render of the dialog
    }

    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const totalAmount = packages.reduce((sum, pkg) => sum + (Number(pkg.settlement) || 0), 0);
        const quoteData = {
          ...formData,
          deliverablesPrice: formData.deliverablesPrice
            ? Number(formData.deliverablesPrice)
            : undefined,
          packages,
          deliverableTasks,
          totalAmount,
        };

        if (editingQuoteRef.current) {
          await updateQuote(editingQuoteRef.current.id, quoteData);
          setLastSaved(new Date());
          setAutoSaveStatus('saved');
        } else {
          // New quote auto-save
          const newQuoteId = crypto.randomUUID();
          const newQuote = {
            id: newQuoteId,
            ...quoteData,
            status: quoteData.status || 'draft',
          } as Quote;
          await addQuote(newQuote);
          setEditingQuote(newQuote);
          setLastSaved(new Date());
          setAutoSaveStatus('saved');
          localStorage.removeItem("quoteDraft");
          localStorage.setItem(`quoteDraft_${newQuoteId}`, JSON.stringify(draft));
        }

        // Version History Capture (throttle to 1 min)
        const now = Date.now();
        if (now - lastCaptureRef.current > 60000) {
          setSessionVersions(prev => [
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              label: "Auto-save",
              data: JSON.parse(JSON.stringify(draft))
            },
            ...prev
          ].slice(0, 30)); // keep last 30
          lastCaptureRef.current = now;
        }
      } catch (error) {
        console.error("Auto-save failed", error);
        setAutoSaveStatus('idle');
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, packages, deliverableTasks, isDialogOpen, updateQuote, addQuote]);

  const handleDownloadPDF = async () => {
    if (formData.status === 'draft') {
      toast.error('Draft quotes cannot be downloaded. Please generate & save the quote as "Sent" or "Approved" first.');
      return;
    }
    
    if (formData.status !== 'sent' && formData.status !== 'approved') {
      toast.error(`Quotes with status "${formData.status}" cannot be downloaded. Only "Sent" or "Approved" quotes can be downloaded.`);
      return;
    }

    if (!previewRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    const originalScrollPos = previewRef.current.parentElement ? previewRef.current.parentElement.scrollTop : window.scrollY;

    try {
      const element = previewRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-[760px]', '').replace('w-full', '').replace('pb-10', '') + ' pdf-export';
      element.style.width = "760px";
      element.style.minWidth = "760px";
      element.style.maxWidth = "760px";
      element.style.padding = "0px";
      element.style.margin = "0px";
      element.style.boxShadow = "none";

      // Allow layout to recalculate
      await new Promise(resolve => setTimeout(resolve, 100));

      const safeTitle = (formData.projectTitle || "Quote")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const htmlToImage = await import("html-to-image");
      const jsPDFModule = await import("jspdf");
      const jsPDF = (
        "default" in jsPDFModule ? jsPDFModule.default : jsPDFModule
      ) as any;

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        width: 760,
        style: {
          margin: '0',
          padding: '0',
          maxWidth: '760px',
          width: '760px',
          boxShadow: 'none',
        }
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeightOriginal = (element.offsetHeight * pdfWidth) / 760;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeightOriginal]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeightOriginal);

      pdf.save(`Proposal_${safeTitle}.pdf`);

      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(
        `Failed to generate PDF: ${errorMessage}. Please try again or use the Print option.`,
      );
    } finally {
      if (previewRef.current && previewRef.current.parentElement) {
        previewRef.current.parentElement.scrollTop = originalScrollPos;
      }
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadNDA = async () => {
    if (!ndaRef.current || isGeneratingNDAPDF || !quoteForNDA) return;

    setIsGeneratingNDAPDF(true);
    try {
      const element = ndaRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-4xl', '') + ' pdf-export';
      element.style.width = "760px";
      element.style.minWidth = "760px";
      element.style.maxWidth = "760px";
      element.style.padding = "40px";
      element.style.margin = "0px";
      element.style.boxShadow = "none";

      await new Promise(resolve => setTimeout(resolve, 100));

      const safeTitle = (quoteForNDA.projectTitle || "Project")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const htmlToImage = await import("html-to-image");
      const jsPDFModule = await import("jspdf");
      const jsPDF = ("default" in jsPDFModule ? jsPDFModule.default : jsPDFModule) as any;

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        width: 760,
        style: {
          margin: '0',
          padding: '40px',
          maxWidth: '760px',
          width: '760px',
        }
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeightOriginal = (element.offsetHeight * pdfWidth) / 760;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeightOriginal]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeightOriginal);

      pdf.save(`NDA_${safeTitle}.pdf`);

      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error("Failed to generate NDA PDF:", error);
      alert("Failed to generate NDA PDF. Please try again.");
    } finally {
      setIsGeneratingNDAPDF(false);
    }
  };

  const handleOpenNDA = (quote: Quote) => {
    setQuoteForNDA(quote);
    setIsNDAAutoSigned(false);
    setIsNDADialogOpen(true);
  };

  const handleOpenContract = (quote: Quote) => {
    setQuoteForContract(quote);
    setIsContractAutoSigned(false);
    setIsContractDialogOpen(true);
  };

  const handleDownloadContract = async () => {
    if (!contractRef.current || isGeneratingContractPDF || !quoteForContract) return;

    setIsGeneratingContractPDF(true);
    try {
      const element = contractRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-4xl', '') + ' pdf-export';
      element.style.width = "760px";
      element.style.minWidth = "760px";
      element.style.maxWidth = "760px";
      element.style.padding = "40px";
      element.style.margin = "0px";
      element.style.boxShadow = "none";

      await new Promise(resolve => setTimeout(resolve, 100));

      const safeTitle = (quoteForContract.projectTitle || "Project")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      
      const htmlToImage = await import("html-to-image");
      const jsPDFModule = await import("jspdf");
      const jsPDF = ("default" in jsPDFModule ? jsPDFModule.default : jsPDFModule) as any;

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        width: 760,
        style: {
          margin: '0',
          padding: '40px',
          maxWidth: '760px',
          width: '760px',
        }
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeightOriginal = (element.offsetHeight * pdfWidth) / 760;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeightOriginal]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeightOriginal);

      pdf.save(`Contract_${safeTitle}.pdf`);

      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error("Error generating Contract PDF:", error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingContractPDF(false);
    }
  };

  const handleOpenPreview = (quote: Quote) => {
    setActivePreviewQuote(quote);
    setFormData({
      quoteNumber: quote.quoteNumber || "",
      projectId: quote.projectId || "",
      clientName: quote.clientName || "",
      clientEmail: quote.clientEmail || "",
      clientPhone: quote.clientPhone || "",
      clientNationality: quote.clientNationality || "",
      clientLeadSource: quote.clientLeadSource || "",
      projectTitle: quote.projectTitle || "",
      location: quote.location || "",
      shootingTime: quote.shootingTime || "",
      photographers: quote.photographers || "",
      issueDate:
        quote.issueDate || quote.date || format(new Date(), "yyyy-MM-dd"),
      quoteValidity: quote.quoteValidity !== undefined ? quote.quoteValidity : defaultFormData.quoteValidity,
      eventDate: quote.eventDate || "",
      moodboardLink: quote.moodboardLink || "",
      note: quote.note || "",
      hasCommercialLicense: quote.hasCommercialLicense || false,
      retainerClause: quote.retainerClause || defaultFormData.retainerClause,
      fulfillmentSchedule:
        quote.fulfillmentSchedule || defaultFormData.fulfillmentSchedule,
      usageLicense: quote.usageLicense || defaultFormData.usageLicense,
      usageRights: quote.usageRights || defaultFormData.usageRights,
      transportLogistics:
        quote.transportLogistics || defaultFormData.transportLogistics,
      cancellationRescheduling:
        quote.cancellationRescheduling ||
        defaultFormData.cancellationRescheduling,
      weatherConditions: quote.weatherConditions !== undefined ? quote.weatherConditions : defaultFormData.weatherConditions,
      selectionAndStorage: quote.selectionAndStorage !== undefined && !OLD_SELECTION_STORAGE_TEXTS.includes(quote.selectionAndStorage) ? quote.selectionAndStorage : defaultFormData.selectionAndStorage,
      paymentDetails: quote.paymentDetails || defaultFormData.paymentDetails,
      status: quote.status,
      date: quote.date,
      revisionOf: quote.revisionOf,
      isCollaboration: quote.isCollaboration || false,
      collaborationCut: quote.collaborationCut || 0,
      collaborationType: quote.collaborationType || "percentage",
      deliverablesSubTitle: quote.deliverablesSubTitle || "",
      deliverablesTitle: quote.deliverablesTitle || "",
      deliverablesPrice: quote.deliverablesPrice?.toString() || "",
      deliverablesNote: quote.deliverablesNote || "",
    });
    setPackages(quote.packages || []);
    setDeliverableTasks(quote.deliverableTasks || []);
    setIsPreviewOpen(true);
  };

  const handleDuplicateQuote = (quote: Quote) => {
    setEditingQuote(null);
    setFormData({
      quoteNumber: generateRevisionNumber(quote),
      projectId: quote.projectId || "",
      clientName: quote.clientName || "",
      clientEmail: quote.clientEmail || "",
      clientPhone: quote.clientPhone || "",
      clientNationality: quote.clientNationality || "",
      clientLeadSource: quote.clientLeadSource || "",
      projectTitle: quote.projectTitle || "",
      location: quote.location || "",
      shootingTime: quote.shootingTime || "",
      photographers: quote.photographers || "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      quoteValidity: quote.quoteValidity !== undefined ? quote.quoteValidity : defaultFormData.quoteValidity,
      eventDate: quote.eventDate || "",
      moodboardLink: quote.moodboardLink || "",
      note: quote.note || "",
      hasCommercialLicense: quote.hasCommercialLicense || false,
      retainerClause: quote.retainerClause || defaultFormData.retainerClause,
      fulfillmentSchedule:
        quote.fulfillmentSchedule || defaultFormData.fulfillmentSchedule,
      usageLicense: quote.usageLicense || defaultFormData.usageLicense,
      usageRights: quote.usageRights || defaultFormData.usageRights,
      transportLogistics:
        quote.transportLogistics || defaultFormData.transportLogistics,
      cancellationRescheduling:
        quote.cancellationRescheduling ||
        defaultFormData.cancellationRescheduling,
      weatherConditions: quote.weatherConditions !== undefined ? quote.weatherConditions : defaultFormData.weatherConditions,
      selectionAndStorage: quote.selectionAndStorage !== undefined && !OLD_SELECTION_STORAGE_TEXTS.includes(quote.selectionAndStorage) ? quote.selectionAndStorage : defaultFormData.selectionAndStorage,
      paymentDetails: quote.paymentDetails || defaultFormData.paymentDetails,
      status: "draft",
      date: format(new Date(), "yyyy-MM-dd"),
      revisionOf: quote.id,
      deliverablesSubTitle: quote.deliverablesSubTitle || "",
      deliverablesTitle: quote.deliverablesTitle || "",
      deliverablesPrice: quote.deliverablesPrice?.toString() || "",
      deliverablesNote: quote.deliverablesNote || "",
    });
    setPackages(
      quote.packages?.map((p) => ({ ...p, id: crypto.randomUUID() })) || [],
    );
    setDeliverableTasks(
      quote.deliverableTasks?.map((t) => ({ ...t, id: crypto.randomUUID() })) ||
        [],
    );
    setIsDialogOpen(true);
  };

  const calculateTotal = () =>
    packages.reduce((sum, pkg) => sum + (Number(pkg.settlement) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotal();

    try {
      const quoteData = {
        ...formData,
        deliverablesPrice: formData.deliverablesPrice
          ? Number(formData.deliverablesPrice)
          : undefined,
        packages,
        deliverableTasks,
        totalAmount,
      };

      if (editingQuote) {
        await updateQuote(editingQuote.id, quoteData);
        localStorage.removeItem(`quoteDraft_${editingQuote.id}`);
        
        if (quoteData.status === "declined") {
          const relatedInvoices = invoices.filter((i) => i.quoteId === editingQuote.id);
          for (const invoice of relatedInvoices) {
            await deleteInvoice(invoice.id);
          }
        }
        
        // Update associated project if it exists
        if (formData.projectId) {
          const project = projects.find((p) => p.id === formData.projectId);
          if (project) {
            const updates: any = {};
            if (formData.eventDate && project.date !== formData.eventDate) {
              updates.date = formData.eventDate;
            }
            if (
              formData.projectTitle &&
              project.title !== formData.projectTitle
            ) {
              updates.title = formData.projectTitle;
            }
            if (Object.keys(updates).length > 0) {
              await updateProject(project.id, updates);
            }
          }
        }
      } else {
        const newQuoteId = crypto.randomUUID();
        await addQuote({
          id: newQuoteId,
          ...quoteData,
        });
        localStorage.removeItem("quoteDraft");

        // Update associated project if it exists
        if (formData.projectId) {
          const project = projects.find((p) => p.id === formData.projectId);
          if (project) {
            const updates: any = {};
            if (formData.eventDate && project.date !== formData.eventDate) {
              updates.date = formData.eventDate;
            }
            if (
              formData.projectTitle &&
              project.title !== formData.projectTitle
            ) {
              updates.title = formData.projectTitle;
            }
            if (Object.keys(updates).length > 0) {
              await updateProject(project.id, updates);
            }
          }
        }
      }
      setIsDialogOpen(false);
      toast.success("Quote Saved");
    } catch (error) {
      console.error("Error saving quote:", error);
      alert(
        "Failed to save quote. Please check your connection and try again.",
      );
    }
  };

  const addDeliverableTask = () => {
    setDeliverableTasks([
      ...deliverableTasks,
      {
        id: crypto.randomUUID(),
        title: `Task ${deliverableTasks.length + 1}`,
        items: [""],
      },
    ]);
  };

  const updateDeliverableTask = (
    id: string,
    field: keyof QuoteDeliverableTask,
    value: any,
  ) => {
    setDeliverableTasks(
      deliverableTasks.map((task) =>
        task.id === id ? { ...task, [field]: value } : task,
      ),
    );
  };

  const removeDeliverableTask = (id: string) => {
    setDeliverableTasks(deliverableTasks.filter((task) => task.id !== id));
  };

  const addDeliverableItem = (taskId: string) => {
    setDeliverableTasks(
      deliverableTasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, items: [...task.items, ""] };
        }
        return task;
      }),
    );
  };

  const updateDeliverableItem = (
    taskId: string,
    index: number,
    value: string,
  ) => {
    setDeliverableTasks(
      deliverableTasks.map((task) => {
        if (task.id === taskId) {
          const newItems = [...task.items];
          newItems[index] = value;
          return { ...task, items: newItems };
        }
        return task;
      }),
    );
  };

  const removeDeliverableItem = (taskId: string, index: number) => {
    setDeliverableTasks(
      deliverableTasks.map((task) => {
        if (task.id === taskId) {
          const newItems = [...task.items];
          newItems.splice(index, 1);
          return { ...task, items: newItems };
        }
        return task;
      }),
    );
  };

  const addPackage = () => {
    setPackages([
      ...packages,
      {
        id: crypto.randomUUID(),
        name: `Package ${packages.length + 1}`,
        inclusions: [""],
        settlement: 0,
      },
    ]);
  };

  const updatePackage = (id: string, field: keyof QuotePackage, value: any) => {
    setPackages(
      packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)),
    );
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter((pkg) => pkg.id !== id));
  };

  const addInclusion = (packageId: string) => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id === packageId) {
          return { ...pkg, inclusions: [...pkg.inclusions, ""] };
        }
        return pkg;
      }),
    );
  };

  const updateInclusion = (packageId: string, index: number, value: string) => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id === packageId) {
          const newInclusions = [...pkg.inclusions];
          newInclusions[index] = value;
          return { ...pkg, inclusions: newInclusions };
        }
        return pkg;
      }),
    );
  };

  const removeInclusion = (packageId: string, index: number) => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id === packageId) {
          const newInclusions = [...pkg.inclusions];
          newInclusions.splice(index, 1);
          return { ...pkg, inclusions: newInclusions };
        }
        return pkg;
      }),
    );
  };

  const addBreakdownItem = (packageId: string) => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id === packageId) {
          return { ...pkg, breakdown: [...(pkg.breakdown || []), { description: "", amount: 0 }] };
        }
        return pkg;
      }),
    );
  };

  const updateBreakdownItem = (packageId: string, index: number, field: 'description' | 'amount', value: any) => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id === packageId) {
          const newBreakdown = [...(pkg.breakdown || [])];
          newBreakdown[index] = { ...newBreakdown[index], [field]: value };
          return { ...pkg, breakdown: newBreakdown };
        }
        return pkg;
      }),
    );
  };

  const removeBreakdownItem = (packageId: string, index: number) => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id === packageId) {
          const newBreakdown = [...(pkg.breakdown || [])];
          newBreakdown.splice(index, 1);
          return { ...pkg, breakdown: newBreakdown };
        }
        return pkg;
      }),
    );
  };

  const expiredQuotesCount = useMemo(() => {
    return quotes.filter(checkIsExpired).length;
  }, [quotes]);

  const getStatusBadge = (status: string, isExpired: boolean = false) => {
    if (isExpired && (status === 'sent' || status === 'draft')) {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
          <Clock className="w-3 h-3 mr-1" /> Expired
        </Badge>
      );
    }
    
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
            <Send className="w-3 h-3 mr-1" /> Sent
          </Badge>
        );
      case "declined":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Declined
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500">
            <FileText className="w-3 h-3 mr-1" /> Draft
          </Badge>
        );
    }
  };

  const handleOpenApproveDialog = (quote: Quote) => {
    setQuoteToApprove(quote);
    setSelectedPackageIds(quote.selectedPackages || []);
    setDepositPercentage(65);
    setIsApproveDialogOpen(true);
  };

  const handleApproveAndInvoice = async () => {
    if (!quoteToApprove) return;

    try {
      const selectedPkgs = quoteToApprove.packages.filter((p) =>
        selectedPackageIds.includes(p.id),
      );
      const totalSelectedAmount = selectedPkgs.reduce(
        (sum, p) => sum + p.settlement,
        0,
      );

      let clientId = "";
      let projectId = quoteToApprove.projectId;

      if (totalSelectedAmount > 0) {
        const lineItems = selectedPkgs.map((p) => ({
          id: crypto.randomUUID(),
          description:
            p.name +
            (p.inclusions.length > 0 ? ` (${p.inclusions.join(", ")})` : ""),
          price: p.settlement,
        }));

        // Add deposit note if applicable
        if (depositPercentage > 0 && depositPercentage < 100) {
          lineItems.push({
            id: crypto.randomUUID(),
            description: `Note: A ${depositPercentage}% deposit (KES ${((totalSelectedAmount * depositPercentage) / 100).toLocaleString()}) is required to secure the booking.`,
            price: 0,
          });
        }

        // Find or create client
        const existingClient = clients.find(
          (c) =>
            c.name.toLowerCase() === quoteToApprove.clientName.toLowerCase(),
        );
        if (existingClient) {
          clientId = existingClient.id;
          if (
            (quoteToApprove.clientNationality && !existingClient.nationality) ||
            (quoteToApprove.clientLeadSource && !existingClient.leadSource)
          ) {
            await updateClient(existingClient.id, {
              nationality: existingClient.nationality || quoteToApprove.clientNationality,
              leadSource: existingClient.leadSource || quoteToApprove.clientLeadSource,
            });
          }
        } else {
          clientId = crypto.randomUUID();
          await addClient({
            id: clientId,
            name: quoteToApprove.clientName,
            email: quoteToApprove.clientEmail,
            phone: quoteToApprove.clientPhone,
            nationality: quoteToApprove.clientNationality,
            leadSource: quoteToApprove.clientLeadSource,
            notes: "Auto-created from quote",
          });
        }

        // Find or create project
        if (!projectId || !projects.find((p) => p.id === projectId)) {
          projectId = crypto.randomUUID();
          await addProject({
            id: projectId,
            clientId,
            title: quoteToApprove.projectTitle,
            location: "",
            date:
              quoteToApprove.eventDate ||
              quoteToApprove.issueDate ||
              format(new Date(), "yyyy-MM-dd"),
            description: quoteToApprove.note || "Auto-created from quote",
            collaborators: [],
          });
        }

        const existingInvoice = invoices.find(i => i.projectId === projectId && i.status !== 'paid');

        if (existingInvoice) {
          const newStatus = existingInvoice.amountPaid >= totalSelectedAmount 
            ? 'paid' 
            : (existingInvoice.amountPaid > 0 ? 'partially_paid' : 'unpaid');
            
          await updateInvoice(existingInvoice.id, {
            quoteId: quoteToApprove.id,
            clientId,
            lineItems,
            totalAmount: totalSelectedAmount,
            status: newStatus
          });
        } else {
          await addInvoice({
            id: crypto.randomUUID(),
            quoteId: quoteToApprove.id,
            projectId,
            clientId,
            lineItems,
            totalAmount: totalSelectedAmount,
            amountPaid: 0,
            status: "unpaid",
            date: format(new Date(), "yyyy-MM-dd"),
            dueDate: format(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              "yyyy-MM-dd",
            ),
          });
        }
      }

      // Update quote status, selected packages, and projectId in a single call
      await updateQuote(quoteToApprove.id, {
        status: "approved",
        selectedPackages: selectedPackageIds,
        ...(projectId ? { projectId } : {}),
      });

      setIsApproveDialogOpen(false);
      setQuoteToApprove(null);
      setSelectedPackageIds([]);
      alert("Quote approved and invoice generated successfully!");
    } catch (error) {
      console.error("Error approving quote:", error);
      alert(
        "Failed to approve quote. Please check your connection and try again.",
      );
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    try {
      const userId = useStore.getState().userId;
      if (!userId) {
        toast.error("You must be logged in to share quotes.");
        return;
      }
      const url = `https://capturecrm.netlify.app/quote/shared?uid=${userId}&id=${quoteId}`;

      navigator.clipboard.writeText(url);
      setCopiedId(quoteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to generate link:", err);
      alert("Failed to generate shareable link.");
    }
  };

  const filteredQuotes = useMemo(() => {
    return [...quotes]
      .filter((quote) => {
        const clientName = (quote.clientName || "").toLowerCase();
        const projectTitle = (quote.projectTitle || "").toLowerCase();
        const qNum = (quote.quoteNumber || "").toLowerCase();
        const search = searchQuery.toLowerCase();
        const matchesSearch = clientName.includes(search) || projectTitle.includes(search) || qNum.includes(search);
        const matchesStatus =
          statusFilter === "all" || quote.status === statusFilter;
        const matchesDate =
          !dateFilter ||
          quote.issueDate === dateFilter ||
          quote.date === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.issueDate).getTime();
        const dateB = new Date(b.date || b.issueDate).getTime();
        if (dateB !== dateA) return dateB - dateA;
        const numA = a.quoteNumber || "";
        const numB = b.quoteNumber || "";
        return numB.localeCompare(numA);
      });
  }, [quotes, searchQuery, statusFilter, dateFilter]);

  return (
    <div className="space-y-6 pb-20">
      <PDFLoader isGenerating={isGeneratingPDF || isGeneratingNDAPDF || isGeneratingContractPDF} />
      
      {expiredQuotesCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4 flex items-start sm:items-center gap-3 shadow-sm animate-in fade-in zoom-in-95">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              You have {expiredQuotesCount} expired {expiredQuotesCount === 1 ? 'quote' : 'quotes'} waiting for review. 
              The validity period has passed based on their issue date.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Quotes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track project quotations and estimates</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap lg:flex-nowrap items-center gap-2.5 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Search quotes, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[180px] lg:w-[200px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-[140px]"
              placeholder="Filter date"
            />
            {dateFilter && (
              <ActionTooltip content="Clear Date Filter">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDateFilter("")}
                  className="shrink-0 h-9 w-9"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </ActionTooltip>
            )}
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shrink-0 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quote
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-slate-50 flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-bold">
                  {editingQuote ? "Edit Quote" : "Create New Quote"}
                </DialogTitle>
                {autoSaveStatus !== 'idle' && (
                  <span className="text-xs text-slate-500 flex items-center">
                    {autoSaveStatus === 'saving' ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Auto-saving...</>
                    ) : (
                      <><CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Saved {lastSaved?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</>
                    )}
                  </span>
                )}
              </div>
              {editingQuote && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`ml-4 transition-colors ${showHistory ? 'bg-slate-100 border-slate-300' : ''}`}
                >
                  <History className="w-4 h-4 mr-2" />
                  Version History
                </Button>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden relative">
              <div className={`overflow-y-auto flex-1 transition-all ${showHistory ? 'pr-72' : ''}`}>
                <form
                  onSubmit={handleSubmit}
                  className="p-4 sm:p-6 space-y-6 sm:space-y-8"
                >
                {/* Client Information & Quote Details Card */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm space-y-6 sm:space-y-8">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        Client Information
                      </div>
                      <div className="w-48">
                        <Select
                          value={formData.status}
                          onValueChange={(value: any) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="clientName"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="clientName"
                          placeholder="e.g. John Doe"
                          value={formData.clientName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="clientEmail"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.clientEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientEmail: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="clientPhone"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Phone Number
                        </Label>
                        <Input
                          id="clientPhone"
                          placeholder="e.g. 0712..."
                          value={formData.clientPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="clientNationality"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Nationality
                        </Label>
                        <Input
                          id="clientNationality"
                          list="quoteNationalities"
                          placeholder="e.g. Kenya, Italy"
                          value={formData.clientNationality}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientNationality: e.target.value,
                            })
                          }
                        />
                        <datalist id="quoteNationalities">
                          <option value="Kenya" />
                          <option value="Italy" />
                          <option value="United Kingdom" />
                          <option value="United States" />
                          <option value="Germany" />
                          <option value="France" />
                          <option value="South Africa" />
                          <option value="Uganda" />
                          <option value="Tanzania" />
                          <option value="Canada" />
                          <option value="Australia" />
                          <option value="India" />
                        </datalist>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="clientLeadSource"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Lead Source
                        </Label>
                        <Input
                          id="clientLeadSource"
                          list="quoteLeadSources"
                          placeholder="e.g. Website, Instagram"
                          value={formData.clientLeadSource}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientLeadSource: e.target.value,
                            })
                          }
                        />
                        <datalist id="quoteLeadSources">
                          <option value="Instagram" />
                          <option value="Facebook" />
                          <option value="Website" />
                          <option value="Referral" />
                          <option value="TikTok" />
                          <option value="Google Search" />
                          <option value="LinkedIn" />
                          <option value="Twitter / X" />
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Quote Details */}
                  <div className="space-y-4">
                    <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                      <FileSignature className="w-4 h-4 mr-2 text-primary" />
                      Quote Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="projectTitle"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Project/Service Title
                        </Label>
                        <Input
                          id="projectTitle"
                          placeholder="e.g. Wedding Photography / Portrait Session"
                          value={formData.projectTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              projectTitle: e.target.value,
                            })
                          }
                          required
                          className="font-semibold"
                        />
                        <p className="text-xs text-slate-400">
                          This appears as the main heading of the quote.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="quoteNumber"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Quote Number
                        </Label>
                        <Input
                          id="quoteNumber"
                          value={formData.quoteNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quoteNumber: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="issueDate"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Issue Date
                        </Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              issueDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="eventDate"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Proposed Event Date
                        </Label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={formData.eventDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              eventDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label
                          htmlFor="shootingTime"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Shooting Time
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={(formData.shootingTime || "").split(" - ")[0] || ""}
                            onChange={(e) => {
                              const parts = (formData.shootingTime || "").split(" - ");
                              const end = parts.length > 1 ? parts[1] : "";
                              setFormData({
                                ...formData,
                                shootingTime: e.target.value ? `${e.target.value} - ${end}` : (end ? ` - ${end}` : ""),
                              });
                            }}
                          />
                          <span className="text-slate-400 font-medium">-</span>
                          <Input
                            type="time"
                            value={(formData.shootingTime || "").split(" - ")[1] || ""}
                            onChange={(e) => {
                              const parts = (formData.shootingTime || "").split(" - ");
                              const start = parts[0] || "";
                              setFormData({
                                ...formData,
                                shootingTime: e.target.value ? `${start} - ${e.target.value}` : start,
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="location"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Location
                        </Label>
                        <Input
                          id="location"
                          placeholder="Event location"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label
                          htmlFor="photographers"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Team / Crew
                        </Label>
                        <Textarea
                          id="photographers"
                          placeholder="e.g. Steve (Photographer)&#10;Mike (Videographer)"
                          value={formData.photographers || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              photographers: e.target.value,
                            })
                          }
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="moodboardLink"
                          className="text-xs font-bold text-slate-500 uppercase"
                        >
                          Moodboard Link (Optional)
                        </Label>
                        <div className="relative">
                          <ExternalLink className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            id="moodboardLink"
                            placeholder="https://pinterest.com/..."
                            className="pl-9"
                            value={formData.moodboardLink}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                moodboardLink: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Collaboration Settings */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        Collaboration & Commission
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCollaboration"
                          checked={!!formData.isCollaboration}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              isCollaboration: checked as boolean,
                            })
                          }
                        />
                        <Label
                          htmlFor="isCollaboration"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Enable My Cut
                        </Label>
                      </div>
                    </div>

                    {formData.isCollaboration && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                        <div className="space-y-2">
                          <Label
                            htmlFor="collaborationType"
                            className="text-xs font-bold text-slate-500 uppercase"
                          >
                            Cut Type
                          </Label>
                          <Select
                            value={formData.collaborationType || "percentage"}
                            onValueChange={(value: any) =>
                              setFormData({
                                ...formData,
                                collaborationType: value,
                              })
                            }
                          >
                            <SelectTrigger
                              id="collaborationType"
                              className="bg-white"
                            >
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">
                                Percentage (%)
                              </SelectItem>
                              <SelectItem value="fixed">
                                Fixed Amount
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="collaborationCut"
                            className="text-xs font-bold text-slate-500 uppercase"
                          >
                            My Cut Value
                          </Label>
                          <Input
                            id="collaborationCut"
                            type="number"
                            min="0"
                            step={
                              formData.collaborationType === "percentage"
                                ? "0.01"
                                : "1"
                            }
                            className="bg-white"
                            value={formData.collaborationCut || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                collaborationCut:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500 md:col-span-2">
                          This is an internal metric and will not be visible to
                          the client on the shared quote.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deliverables By Task (Optional) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Deliverables by Task (Optional)
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                    <p className="text-xs text-slate-500 mb-2">
                      Leave the title blank if you do not want to include this
                      section in the quote.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 uppercase">
                          Sub Title (e.g. FULL FARM DOCUMENTATION)
                        </Label>
                        <Input
                          value={formData.deliverablesSubTitle || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliverablesSubTitle: e.target.value,
                            })
                          }
                          placeholder="Enter sub title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 uppercase">
                          Main Title (e.g. Complete Visual Package)
                        </Label>
                        <Input
                          value={formData.deliverablesTitle || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliverablesTitle: e.target.value,
                            })
                          }
                          placeholder="Enter main title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 uppercase">
                          Total Investment (Ksh)
                        </Label>
                        <Input
                          type="number"
                          value={formData.deliverablesPrice || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliverablesPrice: e.target.value,
                            })
                          }
                          placeholder="e.g. 40000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 uppercase">
                          Additional Note (e.g. + Transport at cost)
                        </Label>
                        <Input
                          value={formData.deliverablesNote || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliverablesNote: e.target.value,
                            })
                          }
                          placeholder="Enter note"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold text-slate-700 uppercase">
                          Tasks
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addDeliverableTask}
                          className="text-primary border-primary/20 hover:bg-primary/5 rounded-full"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Task
                        </Button>
                      </div>

                      {deliverableTasks.map((task, tIndex) => (
                        <div
                          key={task.id}
                          className="p-4 border rounded relative bg-white"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                            onClick={() => removeDeliverableTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <div className="space-y-3">
                            <div className="space-y-2 pr-10">
                              <Label className="text-xs font-bold text-slate-700 uppercase">
                                Task Title
                              </Label>
                              <Input
                                value={task.title}
                                onChange={(e) =>
                                  updateDeliverableTask(
                                    task.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. FARM PROGRESS COVERAGE"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-700 uppercase">
                                Deliverables
                              </Label>
                              {task.items.map((item, iIndex) => (
                                <div
                                  key={iIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <span className="text-slate-400 font-mono text-xs">
                                    {iIndex + 1}.
                                  </span>
                                  <Input
                                    value={item}
                                    onChange={(e) =>
                                      updateDeliverableItem(
                                        task.id,
                                        iIndex,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. Drone video of seedlings"
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeDeliverableItem(task.id, iIndex)
                                    }
                                    className="text-slate-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addDeliverableItem(task.id)}
                                className="text-primary mt-1"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Expected
                                Deliverable
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Investment Packages */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                      <Package className="w-4 h-4 mr-2" />
                      Investment Packages
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPackage}
                      className="text-primary border-primary/20 hover:bg-primary/5 rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add New Package
                    </Button>
                  </div>

                  {packages.map((pkg, pIndex) => (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-xl border shadow-sm overflow-hidden"
                    >
                      <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-primary font-bold">
                            #{pIndex + 1}
                          </span>
                          <Input
                            value={pkg.name}
                            onChange={(e) =>
                              updatePackage(pkg.id, "name", e.target.value)
                            }
                            className="font-bold text-lg border-transparent bg-transparent hover:border-slate-200 focus:bg-white h-8 px-2 w-1/2"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePackage(pkg.id)}
                          className="text-slate-400 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold text-slate-500 uppercase">
                              Inclusions & Scope
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addInclusion(pkg.id)}
                              className="h-7 text-xs rounded-full"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Inclusion
                            </Button>
                          </div>
                          {pkg.inclusions.map((inc, iIndex) => (
                            <div
                              key={iIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder="Description of service inclusion..."
                                value={inc}
                                onChange={(e) =>
                                  updateInclusion(
                                    pkg.id,
                                    iIndex,
                                    e.target.value,
                                  )
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeInclusion(pkg.id, iIndex)}
                                className="text-slate-400 hover:text-destructive shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold text-slate-500 uppercase">
                              Investment Breakdown (Optional)
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addBreakdownItem(pkg.id)}
                              className="h-7 text-xs rounded-full"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Breakdown
                            </Button>
                          </div>
                          {pkg.breakdown?.map((bItem, bIndex) => (
                            <div
                              key={bIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder="Description (e.g., Access & conservation fee)"
                                value={bItem.description}
                                onChange={(e) =>
                                  updateBreakdownItem(
                                    pkg.id,
                                    bIndex,
                                    'description',
                                    e.target.value,
                                  )
                                }
                                className="flex-1"
                              />
                              <div className="relative w-32 shrink-0">
                                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
                                  Ksh
                                </span>
                                <Input
                                  type="number"
                                  className="pl-10"
                                  value={bItem.amount || ""}
                                  onChange={(e) =>
                                    updateBreakdownItem(
                                      pkg.id,
                                      bIndex,
                                      'amount',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBreakdownItem(pkg.id, bIndex)}
                                className="text-slate-400 hover:text-destructive shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-end pt-4 border-t">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                            <div className="flex items-center space-x-3">
                              <Label className="text-xs font-bold text-slate-500 uppercase">
                                Settlement:
                              </Label>
                              <div className="relative w-32">
                                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
                                  Ksh
                                </span>
                                <Input
                                  type="number"
                                  className="pl-10 bg-slate-50"
                                  value={pkg.settlement || ""}
                                  onChange={(e) =>
                                    updatePackage(
                                      pkg.id,
                                      "settlement",
                                      Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`popular-${pkg.id}`}
                                checked={pkg.isMostPopular || false}
                                onCheckedChange={(checked) => {
                                  // Update the package being toggled
                                  updatePackage(pkg.id, "isMostPopular", checked);
                                  
                                  // Optionally ensure only one is popular, or let multiple be popular.
                                  // Let's just let it toggle.
                                }}
                              />
                              <Label
                                htmlFor={`popular-${pkg.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                Mark as Most Popular
                              </Label>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                              Total Valuation
                            </p>
                            <p className="text-2xl font-bold">
                              Ksh {pkg.settlement.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {packages.length === 0 && (
                    <div className="bg-white p-8 rounded-xl border shadow-sm text-center border-dashed">
                      <p className="text-slate-500 mb-4">
                        No packages added yet.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPackage}
                      >
                        Add First Package
                      </Button>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                    <StickyNote className="w-4 h-4 mr-2 text-primary" />
                    Note
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="note"
                      className="text-xs font-bold text-slate-500 uppercase"
                    >
                      Note (Optional)
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note to the client..."
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Legal & Delivery Terms */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                  <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                    <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                    Legal & Delivery Terms
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="quoteValidity"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Quote Validity
                      </Label>
                      <Input
                        id="quoteValidity"
                        value={formData.quoteValidity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quoteValidity: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="retainerClause"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Retainer & Booking Clause
                      </Label>
                      <Textarea
                        id="retainerClause"
                        value={formData.retainerClause}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            retainerClause: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-slate-400">
                        Appears in the "Financial Terms" section of the
                        document.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="fulfillmentSchedule"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Fulfillment Schedule
                      </Label>
                      <Textarea
                        id="fulfillmentSchedule"
                        value={formData.fulfillmentSchedule}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fulfillmentSchedule: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-slate-400">
                        Appears in the "Deliverables" section of the document.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Terms & Logistics */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                  <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                    <FileCheck2 className="w-4 h-4 mr-2 text-primary" />
                    Detailed Terms & Logistics
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3 mb-4">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Contract License Type
                      </Label>
                      <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="hasCommercialLicense"
                            checked={!formData.hasCommercialLicense}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                hasCommercialLicense: false,
                              })
                            }
                            className="text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="text-sm font-medium text-slate-700">Standard License (Personal Use)</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="hasCommercialLicense"
                            checked={formData.hasCommercialLicense}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                hasCommercialLicense: true,
                              })
                            }
                            className="text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="text-sm font-medium text-slate-700">Full Commercial License</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="usageLicense"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Usage License
                      </Label>
                      <Textarea
                        id="usageLicense"
                        placeholder="e.g. Social Media & Web Use only..."
                        value={formData.usageLicense}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usageLicense: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="usageRights"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Usage Rights (Copyright)
                      </Label>
                      <Textarea
                        id="usageRights"
                        value={formData.usageRights}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usageRights: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="transportLogistics"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Transport & Logistics
                      </Label>
                      <Textarea
                        id="transportLogistics"
                        value={formData.transportLogistics}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transportLogistics: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="cancellationRescheduling"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Cancellation & Rescheduling
                      </Label>
                      <Textarea
                        id="cancellationRescheduling"
                        value={formData.cancellationRescheduling}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cancellationRescheduling: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="weatherConditions"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Weather & Conditions
                      </Label>
                      <Textarea
                        id="weatherConditions"
                        value={formData.weatherConditions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            weatherConditions: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="selectionAndStorage"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Selection & Storage
                      </Label>
                      <Textarea
                        id="selectionAndStorage"
                        value={formData.selectionAndStorage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            selectionAndStorage: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="paymentDetails"
                        className="text-xs font-bold text-slate-500 uppercase"
                      >
                        Payment Details
                      </Label>
                      <Textarea
                        id="paymentDetails"
                        value={formData.paymentDetails}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentDetails: e.target.value,
                          })
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t p-4 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!editingQuote) {
                        localStorage.removeItem("quoteDraft");
                      } else {
                        localStorage.removeItem(`quoteDraft_${editingQuote.id}`);
                      }
                      setIsDialogOpen(false);
                    }}
                    className={`rounded-full px-6 w-full sm:w-auto ${!editingQuote ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" : ""}`}
                  >
                    {!editingQuote ? "Discard Draft" : "Discard Changes"}
                  </Button>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPreviewOpen(true)}
                      className="text-primary border-primary/20 hover:bg-primary/5 rounded-full px-6 w-full sm:w-auto"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> Review Document
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 w-full sm:w-auto"
                    >
                      Generate & Save Quote
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Version History Sidebar */}
            {showHistory && (
              <div className="absolute top-0 right-0 bottom-0 w-72 bg-slate-50 border-l border-slate-200 shadow-xl overflow-y-auto p-5 shrink-0 flex flex-col z-20 animate-in slide-in-from-right-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Version History</h3>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowHistory(false)}>
                    <XCircle className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {sessionVersions.map((v, i) => (
                    <div key={v.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group hover:border-primary/30 transition-colors">
                      {i === 0 && <Badge className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-600">Latest</Badge>}
                      <div className="text-sm font-bold text-slate-800">{v.label}</div>
                      <div className="text-xs text-slate-500 mb-4">{v.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                      
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700" 
                        onClick={() => revertToVersion(v)}
                        disabled={i === 0}
                      >
                        <RotateCcw className="w-3 h-3 mr-2" /> 
                        {i === 0 ? 'Current Version' : 'Revert to this'}
                      </Button>
                    </div>
                  ))}
                  
                  {sessionVersions.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-8">
                      No versions saved yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50 flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold">
                Quote Preview
              </DialogTitle>
              <div className="flex items-center gap-2">
                <ActionTooltip content="Generate Service Agreement (Contract)">
                  <Button
                    onClick={() => {
                      if (activePreviewQuote) {
                        setIsPreviewOpen(false);
                        handleOpenContract(activePreviewQuote);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    <FileSignature className="w-4 h-4 mr-1.5 text-primary" />
                    Generate Contract
                  </Button>
                </ActionTooltip>
                <ActionTooltip content="Generate Confidentiality Agreement (NDA)">
                  <Button
                    onClick={() => {
                      if (activePreviewQuote) {
                        setIsPreviewOpen(false);
                        handleOpenNDA(activePreviewQuote);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    <FileText className="w-4 h-4 mr-1.5 text-sky-600" />
                    Generate NDA
                  </Button>
                </ActionTooltip>
                <ActionTooltip content="Download Quote PDF">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    variant="outline"
                    size="sm"
                    className="bg-slate-900 border-none text-white hover:bg-slate-800 hover:text-white"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" /> Download Document
                      </>
                    )}
                  </Button>
                </ActionTooltip>
              </div>
            </div>

            <div className="w-full bg-[#FAF8F4] overflow-x-auto">
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                .quote-root {
                  --cream: #FAF8F4;
                  --warm-white: #F5F2EC;
                  --gold: #B8965A;
                  --gold-light: #D4AC6E;
                  --ink: #1C1C1C;
                  --ink-mid: #3A3A3A;
                  --ink-soft: #888880;
                  --rule: #DDD8CE;
                  --highlight: #F0EBE0;
                  background: var(--cream);
                  color: var(--ink);
                  font-family: 'Poppins', sans-serif;
                  font-weight: 300;
                  line-height: 1.6;
                  text-align: left;
                }
                .quote-root.theme-modern {
                  --cream: #FFFFFF;
                  --warm-white: #F8FAFC;
                  --gold: #3B82F6;
                  --gold-light: #60A5FA;
                  --ink: #0F172A;
                  --ink-mid: #334155;
                  --ink-soft: #64748B;
                  --rule: #E2E8F0;
                  --highlight: #F1F5F9;
                  font-family: 'Poppins', sans-serif;
                }
                .quote-root.theme-modern .header { text-align: center; display: grid; grid-template-columns: 1fr auto 1fr; align-items: baseline; gap: 24px; border-bottom: 2px solid var(--rule); padding-bottom: 32px; }
                .quote-root.theme-modern .header h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 32px; letter-spacing: -1px; margin-bottom: 0; line-height: 1.2; text-align: center; }
                .quote-root.theme-modern .header h1 em { font-style: normal; color: var(--gold); }
                .quote-root.theme-modern .studio-name { margin-bottom: 0; letter-spacing: 2px; text-align: left; white-space: nowrap; }
                .quote-root.theme-modern .header-sub { margin-top: 0; text-align: right; white-space: nowrap; }
                .quote-root.theme-modern .package-card { border-radius: 12px; border: 1px solid var(--rule); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .quote-root.theme-modern .premium-badge { border-radius: 0 0 8px 8px; right: 20px; }
                .quote-root.theme-modern .package-price { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 28px; letter-spacing: -0.5px; }
                .quote-root.theme-modern .total-amount { font-family: 'Poppins', sans-serif; font-weight: 600; }
                .quote-root.theme-minimal {
                  --cream: #FFFFFF;
                  --warm-white: #FAFAFA;
                  --gold: #000000;
                  --gold-light: #555555;
                  --ink: #000000;
                  --ink-mid: #222222;
                  --ink-soft: #666666;
                  --rule: #E5E5E5;
                  --highlight: #F5F5F5;
                  font-family: 'Poppins', sans-serif;
                }
                .quote-root.theme-minimal .header { border-bottom: none; text-align: left; padding-bottom: 24px; margin-bottom: 32px; display: flex; flex-direction: column; }
                .quote-root.theme-minimal .header h1 { font-family: 'Poppins', sans-serif; font-weight: 400; font-size: 24px; text-transform: uppercase; letter-spacing: 4px; margin-top: 16px; margin-bottom: 2px;}
                .quote-root.theme-minimal .header h1 em { font-style: normal; font-weight: 700; color: var(--ink); }
                .quote-root.theme-minimal .studio-name { font-weight: 700; margin-bottom: 0; color: var(--ink); }
                .quote-root.theme-minimal .package-card { padding: 32px; border: none; outline: 1px solid var(--rule); background: transparent; }
                .quote-root.theme-minimal .package-card.featured { outline: 2px solid var(--ink); background: transparent; }
                .quote-root.theme-minimal .package-card.featured .package-price, .quote-root.theme-minimal .package-card.featured .total-amount { color: var(--ink); }
                .quote-root.theme-minimal .package-card.featured .package-header { border-bottom-color: var(--rule); }
                .quote-root.theme-minimal .package-card.featured .total-row { border-top-color: var(--rule); color: var(--ink-soft); }
                .quote-root.theme-minimal .package-card.featured .inclusion-list li { color: var(--ink-mid); }
                .quote-root.theme-minimal .package-card.featured .package-tier { color: var(--ink); font-weight: 700; }
                .quote-root.theme-minimal .package-price { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 400; }
                .quote-root.theme-minimal .premium-badge { background: var(--ink); color: #fff; right: auto; left: 32px; top: -12px; padding: 4px 8px; }
                .quote-root.theme-minimal .total-amount { font-family: 'Poppins', sans-serif; font-size: 20px; }
                .quote-root * { box-sizing: border-box; margin: 0; padding: 0; }
                .quote-root .page { max-width: 760px; margin: 0 auto; padding: 64px 48px 80px; }

                /* ── HEADER ── */
                .quote-root .header { text-align: center; padding-bottom: 48px; border-bottom: 1px solid var(--rule); margin-bottom: 48px; }
                .quote-root .studio-name { font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
                .quote-root .header h1 { font-family: 'Poppins', sans-serif; font-weight: 300; font-size: 48px; line-height: 1.1; color: var(--ink); letter-spacing: -0.5px; margin-bottom: 8px; }
                .quote-root .header h1 em { font-style: italic; color: var(--gold); }
                .quote-root .header-sub { font-size: 13px; font-weight: 400; letter-spacing: 1px; color: var(--ink-soft); margin-top: 10px; }

                /* ── CLIENT META ── */
                .quote-root .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 40px; padding: 28px 32px; background: var(--warm-white); border-left: 3px solid var(--gold); margin-bottom: 52px; font-size: 13px; }
                .quote-root .meta-row { display: grid; grid-template-columns: 120px 1fr; gap: 8px; }
                .quote-root .meta-label { font-weight: 500; color: var(--ink-mid); min-width: 80px; }
                .quote-root .meta-value { color: var(--ink-soft); }

                /* ── SECTION LABEL ── */
                .quote-root .section-label { font-size: 10px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--ink-soft); display: flex; align-items: center; gap: 14px; margin-bottom: 28px; white-space: nowrap; }
                .quote-root .section-label::after { content: ''; flex: 1; height: 1px; background: var(--rule); }

                /* ── PACKAGES GRID ── */
                .quote-root .packages-grid { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; align-items: stretch; }
                .quote-root .packages-grid[data-count="1"] .package-card { flex: 1 1 100%; max-width: 100%; }
                .quote-root .package-card { flex: 1 1 calc(50% - 10px); min-width: 280px; border: 1px solid var(--rule); padding: 28px 26px 22px; position: relative; background: #fff; display: flex; flex-direction: column; }
                .quote-root .package-card.featured { flex: 1 1 100%; border-color: var(--gold); background: var(--ink); }
                .quote-root .package-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid var(--rule); }
                .quote-root .package-card.featured .package-header { border-bottom-color: rgba(255,255,255,0.12); }
                .quote-root .package-tier { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-soft); white-space: nowrap; line-height: 1.4; flex-shrink: 0; }
                .quote-root .package-card.featured .package-tier { color: var(--gold-light); }
                .quote-root .package-price { font-family: 'Poppins', sans-serif; font-size: 28px; font-weight: 400; color: var(--ink); line-height: 1; flex-shrink: 0; white-space: nowrap; text-align: right; }
                .quote-root .package-card.featured .package-price { color: #fff; }
                .quote-root .package-price span { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 400; color: var(--ink-soft); vertical-align: middle; margin-right: 3px; border:none; padding:0; background:transparent;}
                .quote-root .package-card.featured .package-price span { color: rgba(255,255,255,0.5); }
                .quote-root .inclusions-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 12px; white-space: nowrap; }
                .quote-root .package-card.featured .inclusions-label { color: rgba(255,255,255,0.4); }
                .quote-root .inclusion-list { list-style: none; display: block; margin: 0; padding-left: 0; }
                .quote-root .inclusion-list li { font-size: 13.5px; font-weight: 300; color: var(--ink-mid); padding-left: 14px; position: relative; line-height: 1.45; margin-bottom: 9px; display: block; }
                .quote-root .inclusion-list li::before { content: '·'; position: absolute; left: 0; color: var(--gold); font-size: 18px; line-height: 1.1; }
                .quote-root .package-card.featured .inclusion-list li { color: rgba(255,255,255,0.75); }
                .quote-root .package-card.featured .inclusion-list li::before { color: var(--gold-light); }
                .quote-root .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; margin-top: auto; border-top: 1px solid var(--rule); font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-soft); white-space: nowrap; }
                .quote-root .package-card.featured .total-row { border-top-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.45); }
                .quote-root .total-amount { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 400; color: var(--ink); letter-spacing: 0; text-transform: none; }
                .quote-root .package-card.featured .total-amount { color: #fff; }
                .quote-root .premium-badge { position: absolute; top: -1px; right: 28px; background: var(--gold); color: #fff; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 4px 12px; }

                /* ── FEATURED 2-COL BODY ── */
                .quote-root .featured-body { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px;}

                /* ── BREAKDOWN ── */
                .quote-root .breakdown-container { margin-top: 24px; margin-bottom: 24px; padding: 24px 26px; border-top: 1px solid #3a3a3a; border-bottom: 1px solid #3a3a3a; background-color: #3a3a3a; margin-left: -26px; margin-right: -26px; }
                .quote-root .package-card.featured .breakdown-container { border-color: rgba(255,255,255,0.12); background-color: rgba(255,255,255,0.03); }
                .quote-root .breakdown-list { display: flex; flex-direction: column; gap: 16px; }
                .quote-root .breakdown-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; font-size: 13px; }
                .quote-root .breakdown-desc { font-weight: 300; color: rgba(255,255,255,0.85); line-height: 1.4; }
                .quote-root .package-card.featured .breakdown-desc { color: rgba(255,255,255,0.75); }
                .quote-root .breakdown-amount { font-weight: 500; color: #fff; white-space: nowrap; }
                .quote-root .package-card.featured .breakdown-amount { color: #fff; }
                .quote-root .breakdown-container .inclusions-label { color: rgba(255,255,255,0.5); }

                /* ── ADD-ON ── */
                .quote-root .addon { margin-top: 20px; padding: 20px 26px; border: 1px dashed var(--gold); background: var(--warm-white); display: flex; justify-content: space-between; align-items: center; gap: 24px; }
                .quote-root .addon-label { font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 5px; }
                .quote-root .addon-desc { font-size: 13px; color: var(--ink-mid); font-weight: 300; line-height: 1.5; }
                .quote-root .addon-price { font-family: 'Poppins', sans-serif; font-size: 26px; font-weight: 400; color: var(--ink); white-space: nowrap; }
                .quote-root .addon-price span { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 400; color: var(--ink-soft); margin-right: 2px; vertical-align: middle; border:none; background:transparent;}
                .quote-root .addon-note { font-size: 11px; color: var(--ink-soft); margin-top: 4px; font-style: italic; }

                /* ── TERMS SECTION ── */
                .quote-root .terms { margin-top: 56px; }
                .quote-root .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 40px; margin-top: 4px; }
                .quote-root .term-block { padding-top: 20px; }
                .quote-root .term-title { font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink); margin-bottom: 8px; }
                .quote-root .term-body { font-size: 13px; font-weight: 300; color: var(--ink-soft); line-height: 1.65; white-space: pre-wrap; }

                /* ── PAYMENT DETAILS ── */
                .quote-root .payment { margin-top: 48px; padding: 28px 32px; background: var(--warm-white); border-top: 2px solid var(--ink); }
                .quote-root .payment-title { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--ink); margin-bottom: 16px; }
                .quote-root .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 40px; font-size: 13px; color: var(--ink-soft); font-weight: 300; }
                .quote-root .payment-grid div { word-break: break-word; }

                /* ── NOTE ── */
                .quote-root .note { margin-top: 32px; padding: 18px 24px; border-left: 3px solid var(--gold); background: #fff; }
                .quote-root .note-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
                .quote-root .note-label::before { content: '✦'; font-size: 8px; }
                .quote-root .note-body { font-size: 13px; color: var(--ink-mid); font-weight: 400; line-height: 1.7; white-space: pre-wrap; }

                /* ── FOOTER ── */
                .quote-root .footer { margin-top: 52px; padding-top: 24px; border-top: 1px solid var(--rule); text-align: center; }
                .quote-root .footer-name { font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: var(--ink); margin-bottom: 6px; }
                .quote-root .footer-contact { font-size: 12px; font-weight: 300; color: var(--ink-soft); letter-spacing: 0.5px; line-height: 1.8; }

                @media print {
                  .quote-root { background: white; }
                  .quote-root .page { padding: 32px; }
                }

                @media (max-width: 640px) {
                  .quote-root:not(.pdf-export) .page { padding: 32px 20px 48px; }
                  .quote-root:not(.pdf-export) .header h1 { font-size: 28px; }
                  .quote-root.theme-modern:not(.pdf-export) .header { grid-template-columns: 1fr; text-align: center; gap: 12px; }
                  .quote-root.theme-modern:not(.pdf-export) .studio-name { text-align: center; }
                  .quote-root.theme-modern:not(.pdf-export) .header-sub { text-align: center; }
                  .quote-root:not(.pdf-export) .meta { grid-template-columns: 1fr; gap: 12px; padding: 20px; margin-bottom: 32px; }
                  .quote-root:not(.pdf-export) .packages-grid { flex-direction: column; gap: 16px; }
                  .quote-root:not(.pdf-export) .featured-body { grid-template-columns: 1fr; gap: 16px; }
                  .quote-root:not(.pdf-export) .addon { flex-direction: column; align-items: flex-start; gap: 12px; }
                  .quote-root:not(.pdf-export) .terms-grid { grid-template-columns: 1fr; gap: 24px; }
                  .quote-root:not(.pdf-export) .payment { padding: 20px; }
                  .quote-root:not(.pdf-export) .payment-grid { grid-template-columns: 1fr; gap: 12px; }
                }
              `,
                }}
              />
              <div
                ref={previewRef}
                className={`quote-root theme-${getResolvedTheme(settings.documentTheme, settings.companyEmail)} w-full mx-auto max-w-[760px] pb-10`}
              >
                <div className="page">
                  {/* HEADER */}
                  <header className="header">
                    <div className="studio-name">
                      {settings.companyName || "Mwabonje Photography"}
                    </div>
                    <h1>
                      {formData.projectTitle ? (
                        <>
                          {formData.projectTitle.replace(/quotation$/i, '').trim()}{" "}
                          <em>Quotation</em>
                        </>
                      ) : (
                        <>
                          Project <em>Quotation</em>
                        </>
                      )}
                    </h1>
                    <div className="header-sub">
                      Quote No. {formData.quoteNumber}
                    </div>
                  </header>

                  {/* CLIENT META */}
                  <div className="meta">
                    <div className="meta-row">
                      <span className="meta-label">Client</span>
                      <span className="meta-value">
                        {formData.clientName || "Client Name"}
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Date</span>
                      <span className="meta-value">
                        {formData.issueDate
                          ? format(
                              new Date(formData.issueDate),
                              "dd · MM · yyyy",
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Project</span>
                      <span className="meta-value">
                        {formData.projectTitle || "N/A"}
                      </span>
                    </div>
                    {formData.eventDate && (
                      <div className="meta-row">
                        <span className="meta-label">Event Date</span>
                        <span className="meta-value">
                          {format(
                            new Date(formData.eventDate),
                            "dd · MM · yyyy",
                          )}
                        </span>
                      </div>
                    )}
                    {formData.shootingTime && (
                      <div className="meta-row">
                        <span className="meta-label">Shooting Time</span>
                        <span className="meta-value">
                          {formData.shootingTime.includes("-") && formData.shootingTime.split("-")[1].trim()
                            ? `from ${formData.shootingTime}`
                            : formData.shootingTime}
                        </span>
                      </div>
                    )}
                    {formData.location && (
                      <div className="meta-row">
                        <span className="meta-label">Location</span>
                        <span className="meta-value">{formData.location}</span>
                      </div>
                    )}
                    {formData.photographers && formData.photographers.split('\n').map((line, idx) => {
                      if (!line.trim()) return null;
                      
                      const parts = line.split(':');
                      if (parts.length > 1) {
                        return (
                          <div className="meta-row" key={`crew-${idx}`}>
                            <span className="meta-label">{parts[0].trim()}</span>
                            <span className="meta-value">{parts.slice(1).join(':').trim()}</span>
                          </div>
                        );
                      }
                      
                      const parenMatch = line.match(/^(.*?)\s*\((.*?)\)$/);
                      if (parenMatch) {
                        return (
                          <div className="meta-row" key={`crew-${idx}`}>
                            <span className="meta-label">{parenMatch[2].trim()}</span>
                            <span className="meta-value">{parenMatch[1].trim()}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="meta-row" key={`crew-${idx}`}>
                          <span className="meta-label">Crew</span>
                          <span className="meta-value">{line.trim()}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* DELIVERABLES */}
                  {formData.deliverablesTitle && (
                    <>
                      <div className="section-label">{formData.deliverablesSubTitle || "Deliverables"}</div>
                      <div className="package-card flex flex-col mb-[40px]">
                        <div className="package-header w-full">
                          <div className="package-tier">{formData.deliverablesTitle}</div>
                          {formData.deliverablesPrice && (
                            <div className="package-price">
                              <span>Ksh</span>
                              {Number(formData.deliverablesPrice).toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {deliverableTasks && deliverableTasks.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 w-full mb-6">
                            {deliverableTasks.map(task => (
                              <div key={task.id}>
                                <div className="inclusions-label">{task.title}</div>
                                <ul className="inclusion-list">
                                  {task.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                        {formData.deliverablesNote && (
                          <div className="text-[11px] text-[var(--ink-soft)] italic mt-auto pt-4 border-t border-[var(--rule)]">
                            {formData.deliverablesNote}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* PACKAGES */}
                  {packages && packages.length > 0 && (
                    <>
                      <div className="section-label" style={{ marginTop: '50px' }}>Packages</div>
                      <div className="packages-grid" data-count={packages.length}>
                        {packages.map((pkg, index) => {
                          const isFeatured = pkg.isMostPopular;
                          return (
                            <div
                              key={pkg.id}
                              className={`package-card ${isFeatured ? "featured" : ""} flex flex-col`}
                            >
                              {isFeatured && (
                                <span className="premium-badge">
                                  Most Popular
                                </span>
                              )}
                              <div className="package-header w-full">
                                <div className="package-tier">
                                  {pkg.name || `Package ${index + 1}`}
                                </div>
                                <div className="package-price">
                                  <span>Ksh</span>
                                  {pkg.settlement.toLocaleString()}
                                </div>
                              </div>

                              {isFeatured ? (
                                <>
                                  <div className="inclusions-label">
                                    Inclusions
                                  </div>
                                  <div className="featured-body w-full mb-auto">
                                    <ul className="inclusion-list">
                                      {pkg.inclusions.filter(inc => inc.trim() !== "").slice(0, Math.ceil(pkg.inclusions.filter(inc => inc.trim() !== "").length / 2)).map((inc, i) => (<li key={i}>{inc}</li>))}
                                    </ul>
                                    <ul className="inclusion-list">
                                      {pkg.inclusions.filter(inc => inc.trim() !== "").slice(Math.ceil(pkg.inclusions.filter(inc => inc.trim() !== "").length / 2)).map((inc, i) => (<li key={i}>{inc}</li>))}
                                    </ul>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="inclusions-label">
                                    Inclusions
                                  </div>
                                  <ul className="inclusion-list mb-auto w-full">
                                    {pkg.inclusions.filter(inc => inc.trim() !== "").map((inc, i) => (<li key={i}>{inc}</li>))}
                                  </ul>
                                </>
                              )}

                              {pkg.breakdown && pkg.breakdown.length > 0 && (
                                <div className="breakdown-container mt-auto">
                                  <div className="inclusions-label">Investment Breakdown</div>
                                  <div className="breakdown-list">
                                    {pkg.breakdown.map((item, idx) => (
                                      <div key={idx} className="breakdown-item">
                                        <span className="breakdown-desc">{item.description}</span>
                                        <span className="breakdown-amount">
                                          Ksh {item.amount.toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className={`total-row w-full ${(!pkg.breakdown || pkg.breakdown.length === 0) ? 'mt-auto' : ''}`}>
                                <span>Total Investment</span>
                                <span className="total-amount">
                                  Ksh {pkg.settlement.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* NOTE */}
                  {formData.note && (
                    <div className="note">
                      <div className="note-label">Note</div>
                      <div className="note-body">{formData.note}</div>
                    </div>
                  )}

                  {/* TERMS */}
                  {(formData.quoteValidity ||
                    formData.retainerClause ||
                    formData.fulfillmentSchedule ||
                    formData.usageLicense ||
                    formData.usageRights ||
                    formData.transportLogistics ||
                    formData.cancellationRescheduling ||
                    formData.weatherConditions ||
                    formData.selectionAndStorage) && (
                    <div className="terms">
                      <div className="section-label">Terms of Engagement</div>
                      <div className="terms-grid">
                        {formData.quoteValidity && (
                          <div className="term-block">
                            <div className="term-title">Quote Validity</div>
                            <div className="term-body">
                              {formData.quoteValidity}
                            </div>
                          </div>
                        )}
                        {formData.retainerClause && (
                          <div className="term-block">
                            <div className="term-title">
                              Securing Your Session
                            </div>
                            <div className="term-body">
                              {formData.retainerClause}
                            </div>
                          </div>
                        )}
                        {formData.fulfillmentSchedule && (
                          <div className="term-block">
                            <div className="term-title">
                              Production & Delivery
                            </div>
                            <div className="term-body">
                              {formData.fulfillmentSchedule}
                            </div>
                          </div>
                        )}
                        {formData.usageLicense && (
                          <div className="term-block">
                            <div className="term-title">Usage License</div>
                            <div className="term-body">
                              {formData.usageLicense}
                            </div>
                          </div>
                        )}
                        {formData.usageRights && (
                          <div className="term-block">
                            <div className="term-title">Usage Rights</div>
                            <div className="term-body">
                              {formData.usageRights}
                            </div>
                          </div>
                        )}
                        {formData.transportLogistics && (
                          <div className="term-block">
                            <div className="term-title">
                              Transport & Logistics
                            </div>
                            <div className="term-body">
                              {formData.transportLogistics}
                            </div>
                          </div>
                        )}
                        {formData.cancellationRescheduling && (
                          <div className="term-block">
                            <div className="term-title">
                              Cancellation Policy
                            </div>
                            <div className="term-body">
                              {formData.cancellationRescheduling}
                            </div>
                          </div>
                        )}
                        {formData.weatherConditions && (
                          <div className="term-block">
                            <div className="term-title">
                              Weather & Conditions
                            </div>
                            <div className="term-body">
                              {formData.weatherConditions}
                            </div>
                          </div>
                        )}
                        {formData.selectionAndStorage && (
                          <div className="term-block">
                            <div className="term-title">
                              Selection & Storage
                            </div>
                            <div className="term-body">
                              {formData.selectionAndStorage}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAYMENT DETAILS */}
                  {(formData.paymentDetails || settings.paymentDetails) && (
                    <div className="payment">
                      <div className="payment-title">Payment Details</div>
                      <div className="payment-grid">
                        {(() => {
                          const lines = (
                            formData.paymentDetails ||
                            settings.paymentDetails ||
                            ""
                          )
                            .split("\n")
                            .filter((line: string) => line.trim());
                          const mid = Math.ceil(lines.length / 2);
                          const col1 = lines.slice(0, mid);
                          const col2 = lines.slice(mid);

                          const renderLine = (line: string, i: number) => {
                            const parts = line.split(":");
                            if (parts.length > 1) {
                              return (
                                <div key={i} style={{ marginBottom: "4px" }}>
                                  <span style={{ color: "var(--ink-soft)" }}>{parts[0].trim()}:</span>{" "}
                                  <span style={{ color: "var(--ink)" }}>{parts.slice(1).join(":").trim()}</span>
                                </div>
                              );
                            }
                            return <div key={i} style={{ marginBottom: "4px" }}>{line}</div>;
                          };

                          return (
                            <>
                              <div className="payment-col">
                                {col1.map(renderLine)}
                              </div>
                              <div className="payment-col">
                                {col2.map(renderLine)}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  <footer className="footer">
                    <div className="footer-name">
                      {settings.companyName || "Mwabonje Photography"}
                    </div>
                    <div className="footer-contact">
                      {settings.companyEmail} ·{" "}
                      {settings.companyAddress || "Malindi, Kenya"}
                      <br />
                      {settings.companyWebsite} · {settings.companyPhone}
                    </div>
                  </footer>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isApproveDialogOpen}
          onOpenChange={setIsApproveDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Quote & Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Selected Packages
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Select the packages the client has chosen to proceed with.
                </p>
                {quoteToApprove?.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg bg-slate-50"
                  >
                    <Checkbox
                      id={`pkg-${pkg.id}`}
                      checked={selectedPackageIds.includes(pkg.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPackageIds([
                            ...selectedPackageIds,
                            pkg.id,
                          ]);
                        } else {
                          setSelectedPackageIds(
                            selectedPackageIds.filter((id) => id !== pkg.id),
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`pkg-${pkg.id}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {pkg.name}
                    </Label>
                    <span className="font-bold text-sm">
                      KES {pkg.settlement.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Deposit Required (%)
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  This will add a note to the invoice about the required
                  deposit.
                </p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveAndInvoice}
                disabled={selectedPackageIds.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Approve & Generate Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Card View (Phone / Small Tablet) */}
      <div className="block md:hidden space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
            No quotes found matching your filters.
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const myCut = quote.isCollaboration
              ? quote.collaborationType === "percentage"
                ? (quote.totalAmount * (quote.collaborationCut || 0)) / 100
                : quote.collaborationCut || 0
              : 0;

            return (
              <div
                key={quote.id}
                className="bg-white dark:bg-card rounded-xl border border-slate-200/80 dark:border-border p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {quote.quoteNumber || quote.id.substring(0, 8).toUpperCase()}
                    </span>
                    {quote.revisionOf && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 py-0"
                      >
                        Revision
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(quote.issueDate || quote.date), "MMM d, yyyy")}
                    </span>
                    {getStatusBadge(quote.status, checkIsExpired(quote))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
                    {quote.projectTitle || "Untitled Project"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {quote.clientName || "Unknown Client"}
                  </p>
                </div>

                {/* Financial figures */}
                <div className="flex items-baseline justify-between pt-1 bg-slate-50 dark:bg-muted/40 px-3 py-2 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total Amount</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                      KES {quote.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  {quote.isCollaboration && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">My Cut</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        KES {myCut.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons with 44px touch targets */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-border/60">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(quote)}
                      className="h-10 text-xs flex-1 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreview(quote)}
                      className="h-10 text-xs flex-1 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyLink(quote.id)}
                      className="h-10 w-10 shrink-0 text-slate-600 hover:text-primary"
                      title="Copy shared link"
                    >
                      {copiedId === quote.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          title="More options"
                          className="h-10 w-10 shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg bg-white dark:bg-card">
                      <DropdownMenuItem
                        onClick={() => handleOpenContract(quote)}
                        className="cursor-pointer py-2 font-medium"
                      >
                        <FileSignature className="w-4 h-4 mr-2.5 text-primary" />
                        Generate Contract
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenNDA(quote)}
                        className="cursor-pointer py-2 font-medium"
                      >
                        <FileText className="w-4 h-4 mr-2.5 text-sky-600" />
                        Generate NDA
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyLink(quote.id)}
                        className="cursor-pointer py-2"
                      >
                        <LinkIcon className="w-4 h-4 mr-2.5 text-slate-600" />
                        {copiedId === quote.id ? "Link Copied!" : "Copy Shareable Link"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateQuote(quote)}
                        className="cursor-pointer py-2"
                      >
                        <Copy className="w-4 h-4 mr-2.5 text-slate-600" />
                        Create Revision
                      </DropdownMenuItem>
                      {quote.status !== "approved" && quote.status !== "declined" && (
                        <>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => setPendingAction({ type: "approve", quote })}
                            className="cursor-pointer py-2 text-green-600 font-medium"
                          >
                            <CheckSquare className="w-4 h-4 mr-2.5 text-green-600" />
                            Approve & Create Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPendingAction({ type: "decline", quote })}
                            className="cursor-pointer py-2 text-red-600 font-medium"
                          >
                            <XCircle className="w-4 h-4 mr-2.5 text-red-600" />
                            Mark as Declined
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setQuoteToDelete(quote.id)}
                        className="cursor-pointer py-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2.5 text-destructive" />
                        Delete Quote
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop / Tablet Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap">Quote ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                <TableHead className="whitespace-nowrap">My Cut</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right sticky right-0 bg-white/95 dark:bg-card/95 backdrop-blur z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] pr-4 min-w-[210px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No quotes found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => {
                  const myCut = quote.isCollaboration
                      ? quote.collaborationType === "percentage"
                        ? (quote.totalAmount * (quote.collaborationCut || 0)) /
                          100
                        : quote.collaborationCut || 0
                      : 0;

                    return (
                      <TableRow key={quote.id} className="group hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {quote.quoteNumber ||
                            quote.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate" title={quote.projectTitle || "Unknown Project"}>
                          {quote.projectTitle || "Unknown Project"}
                          {quote.revisionOf && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] bg-slate-100 text-slate-500 border-slate-200"
                            >
                              Revision
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate" title={quote.clientName || "Unknown Client"}>
                          {quote.clientName || "Unknown Client"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(
                            new Date(quote.issueDate || quote.date),
                            "MMM d, yyyy",
                          )}
                        </TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          KES {quote.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {quote.isCollaboration ? (
                            <span className="text-green-600 font-semibold">
                              KES {myCut.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(quote.status, checkIsExpired(quote))}</TableCell>
                        <TableCell className="text-right sticky right-0 bg-white dark:bg-card group-hover:bg-slate-50 dark:group-hover:bg-muted/50 transition-colors z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] pr-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Primary visible action: EDIT */}
                            <ActionTooltip content="Edit Quote Details">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(quote)}
                                className="text-slate-700 hover:text-primary hover:bg-slate-100"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </ActionTooltip>

                            {/* Secondary visible action: PREVIEW */}
                            <ActionTooltip content="Preview Quote Document">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenPreview(quote)}
                                className="text-slate-700 hover:text-primary hover:bg-slate-100"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </ActionTooltip>

                            {/* Visible Document action: CONTRACT */}
                            <ActionTooltip content="Generate Service Agreement (Contract)">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenContract(quote)}
                                className="text-slate-700 hover:text-primary hover:bg-slate-100"
                              >
                                <FileSignature className="w-4 h-4 text-primary" />
                              </Button>
                            </ActionTooltip>

                            {/* Visible Document action: NDA */}
                            <ActionTooltip content="Generate Confidentiality Agreement (NDA)">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenNDA(quote)}
                                className="text-slate-700 hover:text-sky-600 hover:bg-slate-100"
                              >
                                <FileText className="w-4 h-4 text-sky-600" />
                              </Button>
                            </ActionTooltip>

                            {/* Quick Approve / Decline buttons if pending review */}
                            {quote.status !== "approved" &&
                              quote.status !== "declined" && (
                                <>
                                  <ActionTooltip content="Approve Quote & Create Invoice">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setPendingAction({ type: "approve", quote })
                                      }
                                      className="hover:bg-green-50"
                                    >
                                      <CheckSquare className="w-4 h-4 text-green-600 hover:text-green-700" />
                                    </Button>
                                  </ActionTooltip>
                                  <ActionTooltip content="Mark Quote as Declined">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setPendingAction({ type: "decline", quote })
                                      }
                                      className="hover:bg-red-50"
                                    >
                                      <XCircle className="w-4 h-4 text-red-500 hover:text-red-700" />
                                    </Button>
                                  </ActionTooltip>
                                </>
                              )}

                            {/* Full Actions Dropdown with labeled options so nothing is hidden */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="More options"
                                    className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-lg bg-white">
                                <DropdownMenuItem
                                  onClick={() => handleOpenDialog(quote)}
                                  className="cursor-pointer py-2 font-medium"
                                >
                                  <Edit className="w-4 h-4 mr-2.5 text-slate-600" />
                                  Edit Quote
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenPreview(quote)}
                                  className="cursor-pointer py-2"
                                >
                                  <Eye className="w-4 h-4 mr-2.5 text-slate-600" />
                                  Preview Quote
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenContract(quote)}
                                  className="cursor-pointer py-2 font-medium text-slate-800"
                                >
                                  <FileSignature className="w-4 h-4 mr-2.5 text-primary" />
                                  Generate Contract
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenNDA(quote)}
                                  className="cursor-pointer py-2 font-medium text-slate-800"
                                >
                                  <FileText className="w-4 h-4 mr-2.5 text-sky-600" />
                                  Generate NDA
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyLink(quote.id)}
                                  className="cursor-pointer py-2"
                                >
                                  {copiedId === quote.id ? (
                                    <CheckCircle2 className="w-4 h-4 mr-2.5 text-green-500" />
                                  ) : (
                                    <LinkIcon className="w-4 h-4 mr-2.5 text-slate-600" />
                                  )}
                                  {copiedId === quote.id ? "Link Copied!" : "Copy Shareable Link"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDuplicateQuote(quote)}
                                  className="cursor-pointer py-2"
                                >
                                  <Copy className="w-4 h-4 mr-2.5 text-slate-600" />
                                  Create Revision
                                </DropdownMenuItem>

                                {quote.status !== "approved" && quote.status !== "declined" && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      onClick={() => setPendingAction({ type: "approve", quote })}
                                      className="cursor-pointer py-2 text-green-600 focus:text-green-700"
                                    >
                                      <CheckSquare className="w-4 h-4 mr-2.5 text-green-600" />
                                      Approve & Create Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setPendingAction({ type: "decline", quote })}
                                      className="cursor-pointer py-2 text-red-600 focus:text-red-700"
                                    >
                                      <XCircle className="w-4 h-4 mr-2.5 text-red-500" />
                                      Mark as Declined
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setQuoteToDelete(quote.id)}
                                  className="cursor-pointer py-2 text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2.5 text-destructive" />
                                  Delete Quote
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNDADialogOpen} onOpenChange={setIsNDADialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
          <div className="flex flex-col h-full relative">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold">
                Confidentiality Agreement (NDA)
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!isNDAAutoSigned && (
                  <Button
                    onClick={() => {
                      if (!settings?.companySignature) {
                        toast.error("Please upload a company signature in Settings first");
                        return;
                      }
                      setIsNDAAutoSigned(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                  >
                    Auto-Sign
                  </Button>
                )}
                <Button
                  onClick={handleDownloadNDA}
                  disabled={isGeneratingNDAPDF}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-none text-white hover:bg-slate-800 hover:text-white"
                >
                  {isGeneratingNDAPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" /> Download Document
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="w-full bg-[#FAF8F4] overflow-y-auto overflow-x-hidden flex-1 h-full py-4 sm:py-10 relative">
              {quoteForNDA && (
                <div className="w-full mx-auto max-w-[760px] pb-10 px-2 sm:px-6">
                  <div className="bg-white mx-auto shadow-2xl relative w-full border border-slate-200">
                    <NDA quote={quoteForNDA} ref={ndaRef} isAutoSigned={isNDAAutoSigned} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
          <div className="flex flex-col h-full relative">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold">
                Service Agreement
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!isContractAutoSigned && (
                  <Button
                    onClick={() => {
                      if (!settings?.companySignature) {
                        toast.error("Please upload a company signature in Settings first");
                        return;
                      }
                      setIsContractAutoSigned(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                  >
                    Auto-Sign
                  </Button>
                )}
                <Button
                  onClick={handleDownloadContract}
                  disabled={isGeneratingContractPDF}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-none text-white hover:bg-slate-800 hover:text-white"
                >
                  {isGeneratingContractPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" /> Download Document
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="w-full bg-[#FAF8F4] overflow-y-auto overflow-x-hidden flex-1 h-full py-4 sm:py-10 relative">
              {quoteForContract && (
                <div className="w-full mx-auto max-w-[760px] pb-10 px-2 sm:px-6">
                  <div className="bg-white mx-auto shadow-2xl relative w-full border border-slate-200">
                    <Contract quote={quoteForContract} ref={contractRef} isAutoSigned={isContractAutoSigned} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={!!quoteToDelete}
        onOpenChange={(open) => !open && setQuoteToDelete(null)}
        onConfirm={() => {
          if (quoteToDelete) {
            deleteQuote(quoteToDelete);
            setQuoteToDelete(null);
          }
        }}
        title="Delete Quote"
        description="Are you sure you want to delete this quote? This action cannot be undone."
      />

      <ConfirmDeleteDialog
        isOpen={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          const { type, quote } = pendingAction;
          setPendingAction(null);

          if (type === "approve") {
            handleOpenApproveDialog(quote);
          } else if (type === "decline") {
            try {
              await updateQuote(quote.id, { status: "declined" });
              
              const relatedInvoices = invoices.filter(i => i.quoteId === quote.id);
              for (const invoice of relatedInvoices) {
                await deleteInvoice(invoice.id);
              }
              
              toast.success("Quote declined successfully");
            } catch (error) {
              toast.error("Failed to decline quote");
            }
          } else if (type === "link") {
            handleCopyLink(quote.id);
          } else if (type === "duplicate") {
            handleDuplicateQuote(quote);
          } else if (type === "edit") {
            handleOpenDialog(quote);
          }
        }}
        title={
          pendingAction?.type === "approve"
            ? "Approve Quote"
            : pendingAction?.type === "decline"
              ? "Decline Quote"
              : pendingAction?.type === "link"
                ? "Copy Link"
                : pendingAction?.type === "duplicate"
                  ? "Create Revision"
                  : "Edit Quote"
        }
        description={
          pendingAction?.type === "approve"
            ? "Are you sure you want to approve this quote? This will proceed to generate an invoice."
            : pendingAction?.type === "decline"
              ? "Are you sure you want to mark this quote as declined?"
              : pendingAction?.type === "link"
                ? "Are you sure you want to copy the shareable link to your clipboard?"
                : pendingAction?.type === "duplicate"
                  ? "Are you sure you want to create a revision/duplicate of this quote?"
                  : "Are you sure you want to edit this quote?"
        }
        confirmText="Proceed"
        isDestructive={false}
      />
    </div>
  );
}

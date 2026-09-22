import React, { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, Quote } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  FileSignature, 
  FileText, 
  Download, 
  Loader2, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  PenTool, 
  Settings as SettingsIcon,
  Plus,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Contract } from '@/components/Contract';
import { NDA } from '@/components/NDA';
import { PDFLoader } from '@/components/PDFLoader';
import { ActionTooltip } from '@/components/ui/tooltip';

export function Contracts() {
  const { quotes, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Contract state
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [quoteForContract, setQuoteForContract] = useState<Quote | null>(null);
  const [isContractAutoSigned, setIsContractAutoSigned] = useState(false);
  const [isGeneratingContractPDF, setIsGeneratingContractPDF] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  // NDA state
  const [isNDADialogOpen, setIsNDADialogOpen] = useState(false);
  const [quoteForNDA, setQuoteForNDA] = useState<Quote | null>(null);
  const [isNDAAutoSigned, setIsNDAAutoSigned] = useState(false);
  const [isGeneratingNDAPDF, setIsGeneratingNDAPDF] = useState(false);
  const ndaRef = useRef<HTMLDivElement>(null);

  // Quick Generate Modal state
  const [isQuickGenerateOpen, setIsQuickGenerateOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<'contract' | 'nda'>('contract');

  const handleOpenContract = (quote: Quote) => {
    setQuoteForContract(quote);
    setIsContractAutoSigned(false);
    setIsContractDialogOpen(true);
  };

  const handleOpenNDA = (quote: Quote) => {
    setQuoteForNDA(quote);
    setIsNDAAutoSigned(false);
    setIsNDADialogOpen(true);
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
      toast.success("Contract downloaded successfully");
    } catch (error) {
      console.error("Error generating Contract PDF:", error);
      toast.error('Failed to generate Contract PDF. Please try again.');
    } finally {
      setIsGeneratingContractPDF(false);
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

      const pdfWidth = 210;
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
      toast.success("NDA downloaded successfully");
    } catch (error) {
      console.error("Failed to generate NDA PDF:", error);
      toast.error("Failed to generate NDA PDF. Please try again.");
    } finally {
      setIsGeneratingNDAPDF(false);
    }
  };

  const handleExecuteQuickGenerate = () => {
    if (!selectedQuoteId) {
      toast.error("Please select a project / quote");
      return;
    }
    const quote = quotes.find(q => q.id === selectedQuoteId);
    if (!quote) {
      toast.error("Selected quote not found");
      return;
    }
    setIsQuickGenerateOpen(false);
    if (selectedDocType === 'contract') {
      handleOpenContract(quote);
    } else {
      handleOpenNDA(quote);
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes
      .filter(quote => {
        const qNum = quote.quoteNumber || quote.id.substring(0, 8);
        const matchesSearch = 
          quote.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quote.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          qNum.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.issueDate).getTime();
        const dateB = new Date(b.date || b.issueDate).getTime();
        return dateB - dateA;
      });
  }, [quotes, searchQuery, statusFilter]);

  const hasSignature = Boolean(settings?.companySignature);

  return (
    <div className="space-y-6 pb-20">
      <PDFLoader isGenerating={isGeneratingContractPDF || isGeneratingNDAPDF} />

      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Contracts & NDAs</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate, auto-sign, and export legally binding Service Agreements and Confidentiality Agreements.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={() => {
              if (quotes.length > 0) {
                setSelectedQuoteId(quotes[0].id);
              }
              setIsQuickGenerateOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Document
          </Button>
        </div>
      </div>

      {/* Info & Signature Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-md">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl shrink-0">
              <FileSignature className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Service Agreements</p>
              <h3 className="text-lg font-bold mt-0.5">Custom Contracts</h3>
              <p className="text-xs text-slate-300 mt-1">
                Formal service agreement with payment schedules, deliverables, licenses, and clauses.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-md">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl shrink-0">
              <FileText className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Confidentiality</p>
              <h3 className="text-lg font-bold mt-0.5">Bulletproof NDAs</h3>
              <p className="text-xs text-slate-300 mt-1">
                Protects confidential project media, footage, guest privacy, and embargoed content.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm ${hasSignature ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
          <CardContent className="p-5 flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${hasSignature ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <PenTool className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-600">Auto-Signature</span>
                {hasSignature ? (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0">Not Configured</Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {hasSignature 
                  ? "Your digital company signature is ready for 1-click document stamping." 
                  : "Upload your company signature in Settings to auto-sign documents instantly."}
              </p>
              <Link 
                to="/settings" 
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline mt-2"
              >
                <SettingsIcon className="w-3.5 h-3.5 mr-1" />
                {hasSignature ? 'Manage Signature' : 'Configure Signature in Settings'}
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client, project, or quote #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quote Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View (Phone / Small Tablet) */}
      <div className="block md:hidden space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border p-8 text-center text-slate-500 shadow-sm">
            <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700 dark:text-slate-200">No quotes or projects found</p>
            <p className="text-xs text-slate-500 mt-1">
              Create a quote to instantly generate service contracts and NDAs.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/quotes">Go to Quotes</Link>
            </Button>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const quoteNumber =
              quote.quoteNumber || quote.id.substring(0, 8).toUpperCase();
            const total = (quote.packages || []).reduce(
              (sum, p) => sum + (Number(p.settlement) || 0),
              0
            );
            const displayDate = quote.date || quote.issueDate;

            return (
              <div
                key={quote.id}
                className="bg-white dark:bg-card rounded-xl border border-slate-200/80 dark:border-border p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-border/60 pb-2.5">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block">
                      {quoteNumber}
                    </span>
                    <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
                      {quote.projectTitle || "Untitled Project"}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      {quote.clientName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs shrink-0 ${
                      quote.status === "approved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : quote.status === "sent"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : quote.status === "declined"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {quote.status || "draft"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {displayDate
                      ? format(new Date(displayDate), "MMM d, yyyy")
                      : "-"}
                  </span>
                  <span className="font-semibold font-mono text-slate-900 dark:text-slate-100 text-sm">
                    KES {total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenContract(quote)}
                    className="h-10 text-xs flex-1 font-medium border-slate-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <FileSignature className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    Contract
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenNDA(quote)}
                    className="h-10 text-xs flex-1 font-medium border-slate-300 hover:border-sky-500 hover:bg-sky-50/50 hover:text-sky-600 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                    NDA
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contracts & NDAs Document Table (Desktop / Tablet) */}
      <Card className="shadow-sm border-slate-200 hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap">Quote / Ref</TableHead>
                <TableHead>Project Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Quote Value</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right sticky right-0 bg-white/95 dark:bg-card/95 backdrop-blur z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] pr-4 min-w-[280px]">
                  Generate Agreements
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-medium text-slate-700">No quotes or projects found</p>
                      <p className="text-xs text-slate-500">
                        Create a quote to instantly generate service contracts and NDAs.
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-2">
                        <Link to="/quotes">Go to Quotes</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => {
                  const quoteNumber = quote.quoteNumber || quote.id.substring(0, 8).toUpperCase();
                  const total = (quote.packages || []).reduce((sum, p) => sum + (Number(p.settlement) || 0), 0);
                  const displayDate = quote.date || quote.issueDate;

                  return (
                    <TableRow key={quote.id} className="group hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {quoteNumber}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={quote.projectTitle}>
                        {quote.projectTitle || 'Untitled Project'}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate" title={quote.clientName}>
                        <div>
                          <p className="font-medium text-slate-800 truncate">{quote.clientName}</p>
                          {quote.clientEmail && (
                            <p className="text-xs text-slate-400 truncate">{quote.clientEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-600">
                        {displayDate ? format(new Date(displayDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap text-slate-800">
                        KES {total.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={`capitalize text-xs ${
                            quote.status === 'approved' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : quote.status === 'sent' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : quote.status === 'declined' 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {quote.status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-white dark:bg-card group-hover:bg-slate-50 dark:group-hover:bg-muted/50 transition-colors z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] pr-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Generate Service Contract Button */}
                          <ActionTooltip content="Generate Service Agreement (Contract)">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenContract(quote)}
                              className="text-xs font-medium border-slate-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors text-slate-700 h-8 px-2.5"
                            >
                              <FileSignature className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              Contract
                            </Button>
                          </ActionTooltip>

                          {/* Generate NDA Button */}
                          <ActionTooltip content="Generate Non-Disclosure Agreement (NDA)">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenNDA(quote)}
                              className="text-xs font-medium border-slate-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors text-slate-700 h-8 px-2.5"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                              NDA
                            </Button>
                          </ActionTooltip>

                          {/* View Quote Link */}
                          <ActionTooltip content="View Quote in Quotes Manager">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-slate-800"
                            >
                              <Link to="/quotes">
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </ActionTooltip>
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

      {/* Quick Generate Modal */}
      <Dialog open={isQuickGenerateOpen} onOpenChange={setIsQuickGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Generate Agreement</DialogTitle>
            <DialogDescription>
              Select a project quote and the type of legal agreement you want to generate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="quote-select">Select Quote / Project</Label>
              <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                <SelectTrigger id="quote-select">
                  <SelectValue placeholder="Choose a quote..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {quotes.map(q => (
                    <SelectItem key={q.id} value={q.id}>
                      {(q.quoteNumber || q.id.substring(0, 8).toUpperCase())} - {q.projectTitle || 'Untitled'} ({q.clientName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agreement Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setSelectedDocType('contract')}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                    selectedDocType === 'contract' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                    <FileSignature className="w-4 h-4 text-primary" />
                    Service Agreement
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard photography/videography service contract.
                  </p>
                </div>

                <div 
                  onClick={() => setSelectedDocType('nda')}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                    selectedDocType === 'nda' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                    <FileText className="w-4 h-4 text-sky-600" />
                    NDA Agreement
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Strict non-disclosure & confidentiality terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsQuickGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExecuteQuickGenerate} className="bg-primary text-primary-foreground">
              Open Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract (Service Agreement) Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
          <div className="flex flex-col h-full relative">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
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
                      toast.success("Document auto-signed with studio signature");
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 hover:bg-slate-100"
                  >
                    <PenTool className="w-3.5 h-3.5 mr-1.5" />
                    Auto-Sign
                  </Button>
                )}
                {isContractAutoSigned && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Auto-Signed
                  </span>
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

      {/* NDA Dialog */}
      <Dialog open={isNDADialogOpen} onOpenChange={setIsNDADialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
          <div className="flex flex-col h-full relative">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
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
                      toast.success("NDA auto-signed with studio signature");
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 hover:bg-slate-100"
                  >
                    <PenTool className="w-3.5 h-3.5 mr-1.5" />
                    Auto-Sign
                  </Button>
                )}
                {isNDAAutoSigned && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Auto-Signed
                  </span>
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
    </div>
  );
}
export default Contracts;

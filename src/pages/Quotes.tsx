import React, { useState } from 'react';
import { useStore, Quote, QuotePackage } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, FileText, CheckCircle2, Send, User, FileSignature, Package, StickyNote, ShieldCheck, FileCheck2, ExternalLink, Link as LinkIcon, CheckSquare, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export function Quotes() {
  const { quotes, clients, projects, settings, addQuote, updateQuote, deleteQuote, addClient, addProject, addInvoice } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [quoteToApprove, setQuoteToApprove] = useState<Quote | null>(null);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [depositPercentage, setDepositPercentage] = useState<number>(50);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  
  const defaultFormData = {
    quoteNumber: '',
    projectId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectTitle: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    eventDate: '',
    moodboardLink: '',
    note: '',
    retainerClause: 'A 50% retainer fee is required to secure your date. Dates are not held without a deposit.',
    fulfillmentSchedule: 'High-resolution digital files will be delivered via online gallery within 14 business days.',
    usageLicense: 'Social Media & Web Use only.',
    usageRights: 'Client receives specific usage rights as detailed. Copyright remains with the photographer.',
    transportLogistics: 'Transport within Nairobi is included. Transport outside Nairobi will be billed at cost.',
    cancellationRescheduling: 'Cancellations made less than 7 days before the shoot forfeit the retainer.',
    paymentDetails: settings.paymentDetails,
    status: 'draft' as Quote['status'],
    date: format(new Date(), 'yyyy-MM-dd'),
    revisionOf: undefined as string | undefined,
    isCollaboration: false,
    collaborationCut: 0,
    collaborationType: 'percentage' as 'percentage' | 'fixed',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [packages, setPackages] = useState<QuotePackage[]>([]);

  const generateQuoteNumber = () => {
    let maxNum = 0;
    quotes.forEach(q => {
      if (q.quoteNumber && q.quoteNumber.startsWith('QT-')) {
        const parts = q.quoteNumber.split('-');
        if (parts.length >= 2) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    return `QT-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const generateRevisionNumber = (originalQuote: Quote) => {
    const baseNumber = originalQuote.quoteNumber || `QT-${originalQuote.id.substring(0, 8).toUpperCase()}`;
    const baseWithoutRev = baseNumber.replace(/-R\d+$/, '');
    
    let maxRev = 0;
    quotes.forEach(q => {
      if (q.quoteNumber && q.quoteNumber.startsWith(`${baseWithoutRev}-R`)) {
        const revPart = q.quoteNumber.split('-R')[1];
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
      slate: 'bg-slate-900',
      blue: 'bg-blue-900',
      green: 'bg-green-900',
      rose: 'bg-rose-900',
      amber: 'bg-amber-900',
      violet: 'bg-violet-900',
    };
    return colors[color] || 'bg-slate-900';
  };

  const handleOpenDialog = (quote?: Quote) => {
    if (quote) {
      setEditingQuote(quote);
      setFormData({
        quoteNumber: quote.quoteNumber || '',
        projectId: quote.projectId || '',
        clientName: quote.clientName || '',
        clientEmail: quote.clientEmail || '',
        clientPhone: quote.clientPhone || '',
        projectTitle: quote.projectTitle || '',
        issueDate: quote.issueDate || quote.date || format(new Date(), 'yyyy-MM-dd'),
        eventDate: quote.eventDate || '',
        moodboardLink: quote.moodboardLink || '',
        note: quote.note || '',
        retainerClause: quote.retainerClause || defaultFormData.retainerClause,
        fulfillmentSchedule: quote.fulfillmentSchedule || defaultFormData.fulfillmentSchedule,
        usageLicense: quote.usageLicense || defaultFormData.usageLicense,
        usageRights: quote.usageRights || defaultFormData.usageRights,
        transportLogistics: quote.transportLogistics || defaultFormData.transportLogistics,
        cancellationRescheduling: quote.cancellationRescheduling || defaultFormData.cancellationRescheduling,
        paymentDetails: quote.paymentDetails || defaultFormData.paymentDetails,
        status: quote.status,
        date: quote.date,
        revisionOf: quote.revisionOf,
        isCollaboration: quote.isCollaboration || false,
        collaborationCut: quote.collaborationCut || 0,
        collaborationType: quote.collaborationType || 'percentage',
      });
      setPackages(quote.packages || []);
    } else {
      setEditingQuote(null);
      setFormData({
        ...defaultFormData,
        quoteNumber: generateQuoteNumber(),
      });
      setPackages([]);
    }
    setIsDialogOpen(true);
  };

  const handleDuplicateQuote = (quote: Quote) => {
    setEditingQuote(null);
    setFormData({
      quoteNumber: generateRevisionNumber(quote),
      projectId: quote.projectId || '',
      clientName: quote.clientName || '',
      clientEmail: quote.clientEmail || '',
      clientPhone: quote.clientPhone || '',
      projectTitle: `${quote.projectTitle || ''} (Revision)`,
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      eventDate: quote.eventDate || '',
      moodboardLink: quote.moodboardLink || '',
      note: quote.note || '',
      retainerClause: quote.retainerClause || defaultFormData.retainerClause,
      fulfillmentSchedule: quote.fulfillmentSchedule || defaultFormData.fulfillmentSchedule,
      usageLicense: quote.usageLicense || defaultFormData.usageLicense,
      usageRights: quote.usageRights || defaultFormData.usageRights,
      transportLogistics: quote.transportLogistics || defaultFormData.transportLogistics,
      cancellationRescheduling: quote.cancellationRescheduling || defaultFormData.cancellationRescheduling,
      paymentDetails: quote.paymentDetails || defaultFormData.paymentDetails,
      status: 'draft',
      date: format(new Date(), 'yyyy-MM-dd'),
      revisionOf: quote.id,
    });
    setPackages(quote.packages?.map(p => ({ ...p, id: crypto.randomUUID() })) || []);
    setIsDialogOpen(true);
  };

  const calculateTotal = () => packages.reduce((sum, pkg) => sum + (Number(pkg.settlement) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotal();
    
    try {
      if (editingQuote) {
        await updateQuote(editingQuote.id, { ...formData, packages, totalAmount });
      } else {
        await addQuote({
          id: crypto.randomUUID(),
          ...formData,
          packages,
          totalAmount,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving quote:", error);
      alert("Failed to save quote. Please check your connection and try again.");
    }
  };

  const addPackage = () => {
    setPackages([...packages, { id: crypto.randomUUID(), name: `Package ${packages.length + 1}`, inclusions: [''], settlement: 0 }]);
  };

  const updatePackage = (id: string, field: keyof QuotePackage, value: any) => {
    setPackages(packages.map(pkg => pkg.id === id ? { ...pkg, [field]: value } : pkg));
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter(pkg => pkg.id !== id));
  };

  const addInclusion = (packageId: string) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        return { ...pkg, inclusions: [...pkg.inclusions, ''] };
      }
      return pkg;
    }));
  };

  const updateInclusion = (packageId: string, index: number, value: string) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const newInclusions = [...pkg.inclusions];
        newInclusions[index] = value;
        return { ...pkg, inclusions: newInclusions };
      }
      return pkg;
    }));
  };

  const removeInclusion = (packageId: string, index: number) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const newInclusions = [...pkg.inclusions];
        newInclusions.splice(index, 1);
        return { ...pkg, inclusions: newInclusions };
      }
      return pkg;
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'sent': return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"><Send className="w-3 h-3 mr-1" /> Sent</Badge>;
      default: return <Badge variant="outline" className="text-slate-500"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  const handleOpenApproveDialog = (quote: Quote) => {
    setQuoteToApprove(quote);
    setSelectedPackageIds(quote.selectedPackages || []);
    setDepositPercentage(50);
    setIsApproveDialogOpen(true);
  };

  const handleApproveAndInvoice = async () => {
    if (!quoteToApprove) return;
    
    try {
      const selectedPkgs = quoteToApprove.packages.filter(p => selectedPackageIds.includes(p.id));
      const totalSelectedAmount = selectedPkgs.reduce((sum, p) => sum + p.settlement, 0);
      
      let clientId = '';
      let projectId = quoteToApprove.projectId;

      if (totalSelectedAmount > 0) {
        const lineItems = selectedPkgs.map(p => ({
          id: crypto.randomUUID(),
          description: p.name + (p.inclusions.length > 0 ? ` (${p.inclusions.join(', ')})` : ''),
          price: p.settlement
        }));

        // Add deposit note if applicable
        if (depositPercentage > 0 && depositPercentage < 100) {
          lineItems.push({
            id: crypto.randomUUID(),
            description: `Note: A ${depositPercentage}% deposit (KES ${(totalSelectedAmount * depositPercentage / 100).toLocaleString()}) is required to secure the booking.`,
            price: 0
          });
        }

        // Find or create client
        const existingClient = clients.find(c => c.name.toLowerCase() === quoteToApprove.clientName.toLowerCase());
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          clientId = crypto.randomUUID();
          await addClient({
            id: clientId,
            name: quoteToApprove.clientName,
            email: quoteToApprove.clientEmail,
            phone: quoteToApprove.clientPhone,
            notes: 'Auto-created from quote'
          });
        }

        // Find or create project
        if (!projectId || !projects.find(p => p.id === projectId)) {
          projectId = crypto.randomUUID();
          await addProject({
            id: projectId,
            clientId,
            title: quoteToApprove.projectTitle,
            location: '',
            date: quoteToApprove.eventDate || quoteToApprove.issueDate || format(new Date(), 'yyyy-MM-dd'),
            description: quoteToApprove.note || 'Auto-created from quote',
            collaborators: []
          });
        }

        await addInvoice({
          id: crypto.randomUUID(),
          quoteId: quoteToApprove.id,
          projectId,
          clientId,
          lineItems,
          totalAmount: totalSelectedAmount,
          amountPaid: 0,
          status: 'unpaid',
          date: format(new Date(), 'yyyy-MM-dd'),
          dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        });
      }

      // Update quote status, selected packages, and projectId in a single call
      await updateQuote(quoteToApprove.id, {
        status: 'approved',
        selectedPackages: selectedPackageIds,
        ...(projectId ? { projectId } : {})
      });

      setIsApproveDialogOpen(false);
      setQuoteToApprove(null);
      setSelectedPackageIds([]);
      alert("Quote approved and invoice generated successfully!");
    } catch (error) {
      console.error("Error approving quote:", error);
      alert("Failed to approve quote. Please check your connection and try again.");
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    try {
      const userId = useStore.getState().userId;
      if (!userId) {
        toast.error('You must be logged in to share quotes.');
        return;
      }
      const url = `${window.location.origin}/quote/shared?uid=${userId}&id=${quoteId}`;
      
      navigator.clipboard.writeText(url);
      setCopiedId(quoteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to generate link:", err);
      alert('Failed to generate shareable link.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Quotes</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-[150px]"
            placeholder="Filter by date"
          />
          {dateFilter && (
            <Button variant="ghost" size="icon" onClick={() => setDateFilter('')} className="shrink-0" title="Clear date filter">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Quote
          </Button>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-slate-50 flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold">{editingQuote ? 'Edit Quote' : 'Create New Quote'}</DialogTitle>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                
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
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                        <SelectTrigger className="h-8 text-xs font-bold uppercase tracking-wider">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-xs font-bold text-slate-500 uppercase">Full Name</Label>
                      <Input id="clientName" placeholder="e.g. John Doe" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail" className="text-xs font-bold text-slate-500 uppercase">Email Address</Label>
                      <Input id="clientEmail" type="email" placeholder="john@example.com" value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone" className="text-xs font-bold text-slate-500 uppercase">Phone Number</Label>
                      <Input id="clientPhone" placeholder="e.g. 0712..." value={formData.clientPhone} onChange={(e) => setFormData({...formData, clientPhone: e.target.value})} />
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
                      <Label htmlFor="projectTitle" className="text-xs font-bold text-slate-500 uppercase">Project/Service Title</Label>
                      <Input id="projectTitle" placeholder="e.g. Wedding Photography / Portrait Session" value={formData.projectTitle} onChange={(e) => setFormData({...formData, projectTitle: e.target.value})} required className="font-semibold" />
                      <p className="text-xs text-slate-400">This appears as the main heading of the quote.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteNumber" className="text-xs font-bold text-slate-500 uppercase">Quote Number</Label>
                      <Input id="quoteNumber" value={formData.quoteNumber} onChange={(e) => setFormData({...formData, quoteNumber: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issueDate" className="text-xs font-bold text-slate-500 uppercase">Issue Date</Label>
                      <Input id="issueDate" type="date" value={formData.issueDate} onChange={(e) => setFormData({...formData, issueDate: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventDate" className="text-xs font-bold text-slate-500 uppercase">Proposed Event Date</Label>
                      <Input id="eventDate" type="date" value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="moodboardLink" className="text-xs font-bold text-slate-500 uppercase">Moodboard Link (Optional)</Label>
                      <div className="relative">
                        <ExternalLink className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="moodboardLink" placeholder="https://pinterest.com/..." className="pl-9" value={formData.moodboardLink} onChange={(e) => setFormData({...formData, moodboardLink: e.target.value})} />
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
                        onCheckedChange={(checked) => setFormData({...formData, isCollaboration: checked as boolean})}
                      />
                      <Label htmlFor="isCollaboration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Enable My Cut
                      </Label>
                    </div>
                  </div>
                  
                  {formData.isCollaboration && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                      <div className="space-y-2">
                        <Label htmlFor="collaborationType" className="text-xs font-bold text-slate-500 uppercase">Cut Type</Label>
                        <Select value={formData.collaborationType || 'percentage'} onValueChange={(value: any) => setFormData({...formData, collaborationType: value})}>
                          <SelectTrigger id="collaborationType" className="bg-white">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collaborationCut" className="text-xs font-bold text-slate-500 uppercase">My Cut Value</Label>
                        <Input 
                          id="collaborationCut" 
                          type="number" 
                          min="0"
                          step={formData.collaborationType === 'percentage' ? "0.1" : "1"}
                          className="bg-white"
                          value={formData.collaborationCut || ''} 
                          onChange={(e) => setFormData({...formData, collaborationCut: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <p className="text-xs text-slate-500 md:col-span-2">
                        This is an internal metric and will not be visible to the client on the shared quote.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Investment Packages */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-800">
                    <Package className="w-4 h-4 mr-2" />
                    Investment Packages
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addPackage} className="text-primary border-primary/20 hover:bg-primary/5 rounded-full">
                    <Plus className="w-4 h-4 mr-1" /> Add New Package
                  </Button>
                </div>

                {packages.map((pkg, pIndex) => (
                  <div key={pkg.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b">
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-primary font-bold">#{pIndex + 1}</span>
                        <Input 
                          value={pkg.name} 
                          onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)} 
                          className="font-bold text-lg border-transparent bg-transparent hover:border-slate-200 focus:bg-white h-8 px-2 w-1/2"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(pkg.id)} className="text-slate-400 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Inclusions & Scope</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addInclusion(pkg.id)} className="h-7 text-xs rounded-full">
                            <Plus className="w-3 h-3 mr-1" /> Add Inclusion
                          </Button>
                        </div>
                        {pkg.inclusions.map((inc, iIndex) => (
                          <div key={iIndex} className="flex items-center gap-2">
                            <Input 
                              placeholder="Description of service inclusion..." 
                              value={inc} 
                              onChange={(e) => updateInclusion(pkg.id, iIndex, e.target.value)} 
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeInclusion(pkg.id, iIndex)} className="text-slate-400 hover:text-destructive shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-end pt-4 border-t">
                        <div className="flex items-center space-x-3">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Settlement:</Label>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">Ksh</span>
                            <Input 
                              type="number" 
                              className="pl-10 bg-slate-50" 
                              value={pkg.settlement || ''} 
                              onChange={(e) => updatePackage(pkg.id, 'settlement', Number(e.target.value))} 
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Valuation</p>
                          <p className="text-2xl font-bold">Ksh {pkg.settlement.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && (
                  <div className="bg-white p-8 rounded-xl border shadow-sm text-center border-dashed">
                    <p className="text-slate-500 mb-4">No packages added yet.</p>
                    <Button type="button" variant="outline" onClick={addPackage}>Add First Package</Button>
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
                  <Label htmlFor="note" className="text-xs font-bold text-slate-500 uppercase">Note (Optional)</Label>
                  <Textarea id="note" placeholder="Add a note to the client..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="min-h-[100px]" />
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
                    <Label htmlFor="retainerClause" className="text-xs font-bold text-slate-500 uppercase">Retainer & Booking Clause</Label>
                    <Textarea id="retainerClause" value={formData.retainerClause} onChange={(e) => setFormData({...formData, retainerClause: e.target.value})} />
                    <p className="text-xs text-slate-400">Appears in the "Financial Terms" section of the document.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fulfillmentSchedule" className="text-xs font-bold text-slate-500 uppercase">Fulfillment Schedule</Label>
                    <Textarea id="fulfillmentSchedule" value={formData.fulfillmentSchedule} onChange={(e) => setFormData({...formData, fulfillmentSchedule: e.target.value})} />
                    <p className="text-xs text-slate-400">Appears in the "Deliverables" section of the document.</p>
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
                  <div className="space-y-2">
                    <Label htmlFor="usageLicense" className="text-xs font-bold text-slate-500 uppercase">Usage License</Label>
                    <Textarea id="usageLicense" placeholder="e.g. Social Media & Web Use only..." value={formData.usageLicense} onChange={(e) => setFormData({...formData, usageLicense: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageRights" className="text-xs font-bold text-slate-500 uppercase">Usage Rights (Copyright)</Label>
                    <Textarea id="usageRights" value={formData.usageRights} onChange={(e) => setFormData({...formData, usageRights: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportLogistics" className="text-xs font-bold text-slate-500 uppercase">Transport & Logistics</Label>
                    <Textarea id="transportLogistics" value={formData.transportLogistics} onChange={(e) => setFormData({...formData, transportLogistics: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancellationRescheduling" className="text-xs font-bold text-slate-500 uppercase">Cancellation & Rescheduling</Label>
                    <Textarea id="cancellationRescheduling" value={formData.cancellationRescheduling} onChange={(e) => setFormData({...formData, cancellationRescheduling: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDetails" className="text-xs font-bold text-slate-500 uppercase">Payment Details</Label>
                    <Textarea id="paymentDetails" value={formData.paymentDetails} onChange={(e) => setFormData({...formData, paymentDetails: e.target.value})} className="min-h-[100px]" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t p-4 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full px-6 w-full sm:w-auto">
                  Discard Quote
                </Button>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} className="text-primary border-primary/20 hover:bg-primary/5 rounded-full px-6 w-full sm:w-auto">
                    <ExternalLink className="w-4 h-4 mr-2" /> Review Document
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 w-full sm:w-auto">
                    Generate & Save Quote
                  </Button>
                </div>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50 flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
              <DialogTitle className="text-xl font-bold">Quote Preview</DialogTitle>
            </div>
            
            <div className="overflow-y-auto flex-1">
            <div className="p-6 sm:p-12 m-4 sm:m-6 bg-white shadow-xl border border-slate-100 relative overflow-hidden font-sans text-slate-800">
              {/* Decorative Top Line */}
              <div className={`absolute top-0 left-0 w-full h-1 ${getColorClass(settings.colorScheme)}`}></div>

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-12">
                <div className="mb-6 sm:mb-0">
                  {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Company Logo" className="h-12 object-contain mb-6" />
                  )}
                  <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Proposal For</h2>
                  <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 leading-tight">{formData.clientName || 'Client Name'}</h1>
                  <p className="text-base text-slate-500 mt-2 font-serif italic mb-3">
                    {formData.projectTitle || 'Project Title'}
                    {formData.revisionOf && (
                      <span className="ml-2 text-[10px] font-sans font-bold tracking-widest uppercase text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full align-middle">
                        Revision
                      </span>
                    )}
                  </p>
                  {(formData.clientEmail || formData.clientPhone) && (
                    <div className="text-xs text-slate-500 space-y-1">
                      {formData.clientEmail && <p>{formData.clientEmail}</p>}
                      {formData.clientPhone && <p>{formData.clientPhone}</p>}
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-2xl sm:text-3xl font-serif text-slate-200 tracking-widest uppercase mb-4">Quote</h2>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Quote No.</p>
                    <p className="text-xs text-slate-800 mb-3 font-mono">{formData.quoteNumber || 'N/A'}</p>
                    
                    <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Issue Date</p>
                    <p className="text-xs text-slate-800 mb-3">{formData.issueDate ? format(new Date(formData.issueDate), 'MMMM d, yyyy') : 'N/A'}</p>
                    
                    {formData.eventDate && (
                      <>
                        <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Event Date</p>
                        <p className="text-xs text-slate-800">{format(new Date(formData.eventDate), 'MMMM d, yyyy')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-200 mb-12"></div>

              {/* Packages */}
              <div className="mb-12">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em] mb-6">Investment Options</h3>
                
                {packages.length === 0 ? (
                  <p className="text-slate-400 italic font-serif text-sm">No packages detailed.</p>
                ) : (
                  <div className="space-y-6">
                    {packages.map((pkg, index) => (
                      <div key={pkg.id} className="border border-slate-200 p-6 relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-slate-400 transition-colors"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                          <h4 className="text-xl font-serif text-slate-900">{pkg.name || `Package ${index + 1}`}</h4>
                          <span className="text-lg font-serif text-slate-900 tracking-wide">
                            Ksh {pkg.settlement.toLocaleString()}
                          </span>
                        </div>
                        {pkg.inclusions.length > 0 && (
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                            {pkg.inclusions.map((inc, i) => (
                              <li key={i} className="flex items-start text-xs text-slate-600">
                                <span className="w-1 h-1 rounded-full bg-slate-300 mr-2 mt-1.5 shrink-0"></span>
                                <span className="leading-relaxed">{inc || 'Empty inclusion'}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note */}
              {formData.note && (
                <div className="mb-12">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em] mb-4">Project Notes</h3>
                  <div className="pl-4 border-l-2 border-slate-200">
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed font-serif italic">{formData.note}</p>
                  </div>
                </div>
              )}

              <div className="w-full h-px bg-slate-200 mb-8"></div>

              {/* Terms */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em] mb-6">Terms & Conditions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {formData.retainerClause && (
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Retainer & Booking</h5>
                      <p className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed">{formData.retainerClause}</p>
                    </div>
                  )}
                  {formData.fulfillmentSchedule && (
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Fulfillment Schedule</h5>
                      <p className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed">{formData.fulfillmentSchedule}</p>
                    </div>
                  )}
                  {formData.usageLicense && (
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Usage License</h5>
                      <p className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed">{formData.usageLicense}</p>
                    </div>
                  )}
                  {formData.usageRights && (
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Usage Rights</h5>
                      <p className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed">{formData.usageRights}</p>
                    </div>
                  )}
                  {formData.transportLogistics && (
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Transport & Logistics</h5>
                      <p className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed">{formData.transportLogistics}</p>
                    </div>
                  )}
                  {formData.cancellationRescheduling && (
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Cancellation</h5>
                      <p className="text-slate-500 text-xs whitespace-pre-wrap leading-relaxed">{formData.cancellationRescheduling}</p>
                    </div>
                  )}
                  {formData.paymentDetails && (
                    <div className="md:col-span-2 bg-slate-50 p-6 border border-slate-100">
                      <h5 className="font-bold text-slate-900 mb-2 text-[10px] uppercase tracking-wider">Payment Details</h5>
                      <p className="text-slate-600 text-xs whitespace-pre-wrap leading-relaxed">{formData.paymentDetails}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Signature Area */}
              <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 sm:gap-0">
                <div className="w-full sm:w-auto">
                  <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-6">Accepted By</p>
                  <div className="w-full sm:w-32 h-px bg-slate-300 mb-2"></div>
                  <p className="text-[10px] text-slate-500">Signature / Date</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="font-bold text-slate-900 text-sm">{settings.companyName}</p>
                  {settings.companyEmail && <p className="text-xs text-slate-500 break-all">{settings.companyEmail}</p>}
                  {settings.companyPhone && <p className="text-xs text-slate-500">{settings.companyPhone}</p>}
                  {settings.companyWebsite && <p className="text-xs text-slate-500 break-all">{settings.companyWebsite}</p>}
                  {settings.companyAddress && <p className="text-xs text-slate-500 whitespace-pre-wrap mt-1">{settings.companyAddress}</p>}
                  <p className="text-xs text-slate-500 mt-2 italic">Thank you for your business.</p>
                </div>
              </div>
            </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Quote & Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Selected Packages</Label>
                <p className="text-xs text-slate-500 mb-2">Select the packages the client has chosen to proceed with.</p>
                {quoteToApprove?.packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-slate-50">
                    <Checkbox 
                      id={`pkg-${pkg.id}`} 
                      checked={selectedPackageIds.includes(pkg.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPackageIds([...selectedPackageIds, pkg.id]);
                        } else {
                          setSelectedPackageIds(selectedPackageIds.filter(id => id !== pkg.id));
                        }
                      }}
                    />
                    <Label htmlFor={`pkg-${pkg.id}`} className="flex-1 cursor-pointer font-medium">
                      {pkg.name}
                    </Label>
                    <span className="font-bold text-sm">KES {pkg.settlement.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Deposit Required (%)</Label>
                <p className="text-xs text-slate-500 mb-2">This will add a note to the invoice about the required deposit.</p>
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
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
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

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>My Cut</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.filter(quote => {
                const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
                const matchesDate = !dateFilter || (quote.issueDate === dateFilter || quote.date === dateFilter);
                return matchesStatus && matchesDate;
              }).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No quotes found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                [...quotes].filter(quote => {
                  const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
                  const matchesDate = !dateFilter || (quote.issueDate === dateFilter || quote.date === dateFilter);
                  return matchesStatus && matchesDate;
                }).sort((a, b) => {
                  const dateA = new Date(a.date || a.issueDate).getTime();
                  const dateB = new Date(b.date || b.issueDate).getTime();
                  if (dateB !== dateA) return dateB - dateA;
                  const numA = a.quoteNumber || '';
                  const numB = b.quoteNumber || '';
                  return numB.localeCompare(numA);
                }).map((quote) => {
                  const myCut = quote.isCollaboration 
                    ? (quote.collaborationType === 'percentage' 
                        ? (quote.totalAmount * (quote.collaborationCut || 0) / 100) 
                        : (quote.collaborationCut || 0))
                    : 0;
                    
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {quote.quoteNumber || quote.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.projectTitle || 'Unknown Project'}
                        {quote.revisionOf && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-slate-100 text-slate-500 border-slate-200">
                            Revision
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{quote.clientName || 'Unknown Client'}</TableCell>
                      <TableCell>{format(new Date(quote.issueDate || quote.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-semibold">KES {quote.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {quote.isCollaboration ? (
                          <span className="text-green-600 font-semibold">KES {myCut.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right">
                        {quote.status !== 'approved' && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenApproveDialog(quote)} title="Approve & Create Invoice">
                            <CheckSquare className="w-4 h-4 text-green-600 hover:text-green-700" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleCopyLink(quote.id)} title="Copy Shareable Link" className="relative">
                          {copiedId === quote.id ? (
                            <span className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                              Copied!
                            </span>
                          ) : null}
                          {copiedId === quote.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <LinkIcon className="w-4 h-4 text-slate-500 hover:text-primary" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicateQuote(quote)} title="Create Revision">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(quote)} title="Edit Quote">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setQuoteToDelete(quote.id)} title="Delete Quote">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  );
}

import { PDFLoader } from "@/components/PDFLoader";
import React, { useState, useRef, useEffect } from "react";
import { useStore, Invoice, LineItem, Quote } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, CheckCircle2, AlertCircle, ExternalLink, Download, Copy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { getResolvedTheme } from '@/lib/theme';

import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';


export function Invoices() {
  const { invoices, quotes, projects, clients, settings, addInvoice, updateInvoice, deleteInvoice } = useStore();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedId = searchParams.get('highlight');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "duplicate" | "edit";
    invoice: Invoice;
  } | null>(null);

  const [formData, setFormData] = useState({
    quoteId: 'none',
    projectId: '',
    clientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const handleOpenPreview = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isGeneratingPDF || !previewInvoice) return;
    
    setIsGeneratingPDF(true);
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const element = invoiceRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-[760px]', '').replace('w-full', '') + ' pdf-export';
      element.style.width = '760px'; // changed from 800 to 760 to match standard
      element.style.minWidth = '760px';
      element.style.maxWidth = '760px';
      element.style.margin = '0px';
      element.style.padding = '0px';
      element.style.boxShadow = 'none';
      
      // Allow layout to recalculate
      await new Promise(resolve => setTimeout(resolve, 100));

      const project = projects.find(p => p.id === previewInvoice.projectId);
      const safeTitle = (project?.title || 'Invoice').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      const htmlToImage = await import('html-to-image');
      const jsPDFModule = await import('jspdf');
      const jsPDF = ('default' in jsPDFModule ? jsPDFModule.default : jsPDFModule) as any;

      const dataUrl = await htmlToImage.toPng(element, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#FAF8F4',
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
      
      pdf.save(`Invoice_${safeTitle}.pdf`);
      
      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      window.scrollTo(0, originalScrollPos);
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyLink = () => {
    if (!previewInvoice) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error("You must be logged in to share an invoice.");
      return;
    }
    const url = `https://capturecrm.netlify.app/invoice/shared?uid=${uid}&id=${previewInvoice.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Invoice link copied to clipboard!");
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

  const renderDescription = (description: string) => {
    if (!description) return <div className="item-name">Item description</div>;
    
    // Check if description matches "Title (Item 1, Item 2)" format
    const match = description.match(/^(.*?)\s*\((.*)\)$/);
    if (match) {
      const [_, title, inclusionsStr] = match;
      const inclusions = inclusionsStr.split(/,(?![^(]*\))/).map(s => s.trim()).filter(Boolean);
      return (
        <div>
          <div className="item-name">{title}</div>
          {inclusions.length > 0 && (
            <ul className="item-desc" style={{ listStyleType: 'square', paddingLeft: '1.25rem', marginTop: '0.25rem', marginBottom: '0' }}>
              {inclusions.map((inc, i) => (
                <li key={i} style={{ paddingLeft: '0.25rem', marginBottom: '0.25rem' }}>{inc}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    
    return <div className="item-name">{description}</div>;
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    setEditingInvoice(null);
    setFormData({
      quoteId: invoice.quoteId || 'none',
      projectId: invoice.projectId,
      clientId: invoice.clientId,
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    });
    setLineItems(
      invoice.lineItems.map(item => ({
        ...item,
        id: crypto.randomUUID()
      }))
    );
    setIsDialogOpen(true);
  };

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      
      const savedDraft = localStorage.getItem(`invoiceDraft_${invoice.id}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed.formData || {
            quoteId: invoice.quoteId || 'none',
            projectId: invoice.projectId,
            clientId: invoice.clientId,
            date: invoice.date,
            dueDate: invoice.dueDate,
          });
          setLineItems(parsed.lineItems || invoice.lineItems || []);
        } catch (e) {
          console.error("Failed to parse invoice draft", e);
        }
      } else {
        setFormData({
          quoteId: invoice.quoteId || 'none',
          projectId: invoice.projectId,
          clientId: invoice.clientId,
          date: invoice.date,
          dueDate: invoice.dueDate,
        });
        setLineItems(invoice.lineItems || []);
      }
    } else {
      setEditingInvoice(null);
      const savedDraft = localStorage.getItem("invoiceDraft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed.formData || {
            quoteId: 'none',
            projectId: '',
            clientId: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          });
          setLineItems(parsed.lineItems || []);
        } catch (e) {
          setFormData({
            quoteId: 'none',
            projectId: '',
            clientId: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          });
          setLineItems([]);
        }
      } else {
        setFormData({
          quoteId: 'none',
          projectId: '',
          clientId: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        });
        setLineItems([]);
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
    if (isDialogOpen) {
      const draft = {
        formData,
        lineItems,
      };
      if (editingInvoice) {
        localStorage.setItem(`invoiceDraft_${editingInvoice.id}`, JSON.stringify(draft));
      } else {
        localStorage.setItem("invoiceDraft", JSON.stringify(draft));
      }
    }
  }, [formData, lineItems, editingInvoice, isDialogOpen]);

  const handleQuoteSelect = (quoteId: string) => {
    if (quoteId === 'none') {
      setFormData({ ...formData, quoteId: 'none' });
      return;
    }
    
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const project = projects.find(p => p.id === quote.projectId);
      setFormData({
        ...formData,
        quoteId,
        projectId: quote.projectId,
        clientId: project?.clientId || '',
      });
      // Convert quote packages to line items
      setLineItems(
        quote.packages.map(pkg => ({
          id: crypto.randomUUID(),
          description: pkg.name,
          price: pkg.settlement,
        }))
      );
    }
  };

  const calculateTotal = () => lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotal();
    
    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, { ...formData, lineItems, totalAmount });
        localStorage.removeItem(`invoiceDraft_${editingInvoice.id}`);
      } else {
        await addInvoice({
          id: crypto.randomUUID(),
          ...formData,
          quoteId: formData.quoteId === 'none' ? undefined : formData.quoteId,
          lineItems,
          totalAmount,
          amountPaid: 0,
          status: 'unpaid',
        });
        localStorage.removeItem("invoiceDraft");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Please check your connection and try again.");
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', price: 0 }]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'partially_paid': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> Partial</Badge>;
      default: return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50"><FileText className="w-3 h-3 mr-1" /> Unpaid</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PDFLoader isGenerating={isGeneratingPDF} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" />}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quote">Generate from Quote</Label>
                  <Select
                    value={formData.quoteId}
                    onValueChange={handleQuoteSelect}
                    disabled={!!editingInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quote (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Create from scratch</SelectItem>
                      {quotes.filter(q => q.status === 'approved' || q.status === 'sent').map((quote) => {
                        const project = projects.find(p => p.id === quote.projectId);
                        return (
                          <SelectItem key={quote.id} value={quote.id}>
                            {project?.title} - KES {quote.totalAmount.toLocaleString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => {
                      const project = projects.find(p => p.id === value);
                      setFormData({ ...formData, projectId: value, clientId: project?.clientId || '' });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Services</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Service description"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-40 relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">KES</span>
                        <Input
                          type="number"
                          className="pl-10"
                          placeholder="0.00"
                          min="0"
                          value={item.price || ''}
                          onChange={(e) => updateLineItem(item.id, 'price', Number(e.target.value))}
                          required
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(item.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {lineItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                      No services added. Click "Add Service" to start.
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-2xl font-bold">KES {calculateTotal().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  if (editingInvoice) {
                    localStorage.removeItem(`invoiceDraft_${editingInvoice.id}`);
                  } else {
                    localStorage.removeItem("invoiceDraft");
                  }
                  setIsDialogOpen(false);
                }}>
                  {editingInvoice ? 'Discard Changes' : 'Discard Draft'}
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {editingInvoice ? 'Update Invoice' : 'Save Invoice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50">
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
              <DialogTitle className="text-xl font-bold">Invoice Preview</DialogTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </Button>
                <Button size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Download PDF</>
                  )}
                </Button>
              </div>
            </div>
            
            {previewInvoice && (() => {
              const client = clients.find(c => c.id === previewInvoice.clientId);
              const project = projects.find(p => p.id === previewInvoice.projectId);
              const balance = previewInvoice.totalAmount - previewInvoice.amountPaid;

              return (
                <div className="m-4 sm:m-6">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .invoice-root {
                      --cream: #FAF8F4;
                      --warm-white: #F5F2EC;
                      --gold: #B8965A;
                      --gold-light: #D4AC6E;
                      --ink: #1C1C1C;
                      --ink-mid: #3A3A3A;
                      --ink-soft: #888880;
                      --rule: #DDD8CE;
                      --red: #C0392B;
                      --green: #2E7D52;
                      background: var(--cream);
                      color: var(--ink);
                      font-family: 'Jost', sans-serif;
                      font-weight: 300;
                      line-height: 1.6;
                      text-align: left;
                      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    }
                    .invoice-root.theme-modern {
                      --cream: #FFFFFF;
                      --warm-white: #F8FAFC;
                      --gold: #3B82F6;
                      --gold-light: #60A5FA;
                      --ink: #0F172A;
                      --ink-mid: #334155;
                      --ink-soft: #64748B;
                      --rule: #E2E8F0;
                      --red: #EF4444;
                      --green: #22C55E;
                      font-family: 'Inter', sans-serif;
                    }
                    .invoice-root.theme-modern .header { align-items: flex-end; padding-bottom: 24px; border-bottom: 2px solid var(--rule); }
                    .invoice-root.theme-modern .header-left .studio-name { font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: -0.5px; text-transform: none; font-size: 24px; }
                    .invoice-root.theme-modern .header-right { text-align: right; }
                    .invoice-root.theme-modern .invoice-label { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 36px; letter-spacing: -1px; margin-bottom: 4px; }
                    .invoice-root.theme-modern .invoice-label em { font-style: normal; color: var(--gold); }
                    .invoice-root.theme-modern .meta-wrap { background: var(--warm-white); border-radius: 8px; border: 1px solid var(--rule); padding: 16px; margin-bottom: 40px; }
                    .invoice-root.theme-modern .meta-block { padding: 12px; border: none; }
                    .invoice-root.theme-modern .meta-block.accent { border-left: 2px solid var(--gold); }
                    .invoice-root.theme-modern .items-table { outline: 1px solid var(--rule); border-radius: 8px; overflow: hidden; margin-bottom: 32px; }
                    .invoice-root.theme-modern .items-table thead tr { background: var(--warm-white); border-bottom: 1px solid var(--rule); }
                    .invoice-root.theme-modern .items-table tbody tr { border-bottom: 1px solid var(--rule); }
                    .invoice-root.theme-modern .items-table tbody tr:last-child { border-bottom: none; }
                    .invoice-root.theme-modern .items-table thead th { padding: 16px 20px; }
                    .invoice-root.theme-modern .items-table tbody td { padding: 16px 20px; }
                    .invoice-root.theme-modern .item-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; }
                    .invoice-root.theme-modern .items-table tbody td:last-child { font-family: 'Inter', sans-serif; font-weight: 600; }
                    .invoice-root.theme-modern .totals-block { border-top: 2px solid var(--rule); }
                    .invoice-root.theme-modern .totals-row.grand .amount { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; }
                    .invoice-root.theme-minimal {
                      --cream: #FFFFFF;
                      --warm-white: #F0F0F0;
                      --gold: #000000;
                      --gold-light: #333333;
                      --ink: #000000;
                      --ink-mid: #222222;
                      --ink-soft: #666666;
                      --rule: #000000;
                      --red: #000000;
                      --green: #000000;
                      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    }
                    .invoice-root.theme-minimal .header { flex-direction: column; border-bottom: none; gap: 24px; padding-bottom: 0; margin-bottom: 48px; }
                    .invoice-root.theme-minimal .header-right { text-align: left; }
                    .invoice-root.theme-minimal .invoice-label { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; font-size: 24px; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 8px;}
                    .invoice-root.theme-minimal .invoice-label em { font-style: normal; font-weight: 700; color: var(--ink); }
                    .invoice-root.theme-minimal .header-left .studio-name { font-weight: 700; margin-bottom: 0; color: var(--ink); }
                    .invoice-root.theme-minimal .meta-wrap { grid-template-columns: 1fr 1fr; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 24px 0; gap: 24px; margin-bottom: 48px; }
                    .invoice-root.theme-minimal .meta-block, .invoice-root.theme-minimal .meta-block.accent { border: none; padding: 0; background: transparent; }
                    .invoice-root.theme-minimal .meta-line { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; text-align: right; }
                    .invoice-root.theme-minimal .meta-line strong { flex-shrink: 0; text-align: left; }
                    .invoice-root.theme-minimal .items-table { border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
                    .invoice-root.theme-minimal .items-table thead tr { border-bottom: 1px solid var(--ink); }
                    .invoice-root.theme-minimal .items-table thead th { font-weight: 700; color: var(--ink); }
                    .invoice-root.theme-minimal .items-table tbody tr { border-bottom: 1px solid var(--rule); }
                    .invoice-root.theme-minimal .items-table thead th { padding: 12px 0; }
                    .invoice-root.theme-minimal .items-table tbody td { padding: 12px 0; }
                    .invoice-root.theme-minimal .item-name { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 700; text-transform: uppercase; font-size: 12px; }
                    .invoice-root.theme-minimal .items-table tbody td:last-child { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
                    .invoice-root.theme-minimal .totals-block { border-top: none; }
                    .invoice-root.theme-minimal .totals-row.grand { border-top: 1px solid var(--ink); border-bottom: 1px double var(--ink); padding: 12px 0; margin-top: 8px; }
                    .invoice-root.theme-minimal .totals-row.grand .amount { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 700; font-size: 18px; }
                    .invoice-root.theme-minimal .note { background: transparent; padding: 16px 0; border-left: none; border-top: 1px solid var(--ink); margin-top: 48px; }

                    .invoice-root * { box-sizing: border-box; }

                    .invoice-root .page {
                      max-width: 760px;
                      margin: 0 auto;
                      padding: 64px 48px 80px;
                    }

                    /* ── HEADER ── */
                    .invoice-root .header {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      padding-bottom: 40px;
                      border-bottom: 1px solid var(--rule);
                      margin-bottom: 40px;
                      margin-top: 0;
                    }

                    .invoice-root .header-left .studio-name {
                      font-family: 'Cormorant Garamond', serif;
                      font-size: 22px;
                      font-weight: 400;
                      letter-spacing: 3px;
                      text-transform: uppercase;
                      color: var(--ink);
                      margin-bottom: 4px;
                      margin-top: 0;
                    }

                    .invoice-root .header-left .studio-tagline {
                      font-size: 11px;
                      font-weight: 400;
                      letter-spacing: 2px;
                      text-transform: uppercase;
                      color: var(--gold);
                      margin: 0;
                    }

                    .invoice-root .header-right {
                      text-align: right;
                    }

                    .invoice-root .invoice-label {
                      font-family: 'Cormorant Garamond', serif;
                      font-size: 42px;
                      font-weight: 300;
                      color: var(--ink);
                      line-height: 1;
                      letter-spacing: -1px;
                      margin: 0;
                    }

                    .invoice-root .invoice-label em {
                      font-style: italic;
                      color: var(--gold);
                    }

                    .invoice-root .invoice-number {
                      font-size: 11px;
                      font-weight: 500;
                      letter-spacing: 2px;
                      color: var(--ink-soft);
                      margin-top: 6px;
                      margin-bottom: 0;
                    }

                    /* ── STATUS BADGE ── */
                    .invoice-root .status-badge {
                      display: inline-block;
                      margin-top: 10px;
                      padding: 4px 14px;
                      font-size: 9px;
                      font-weight: 600;
                      letter-spacing: 2.5px;
                      text-transform: uppercase;
                    }

                    .invoice-root .status-unpaid   { background: #FEF3CD; color: #7A5700; border: 1px solid #F0D070; }
                    .invoice-root .status-partial  { background: #EAF4FE; color: #0C5FA8; border: 1px solid #B0D4FA; }
                    .invoice-root .status-paid     { background: #E8F4EC; color: var(--green); border: 1px solid #A8D8B4; }

                    /* ── META GRID ── */
                    .invoice-root .meta-wrap {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 24px;
                      margin-bottom: 48px;
                    }

                    .invoice-root .meta-block {
                      padding: 22px 26px;
                      background: var(--warm-white);
                      border-left: 3px solid var(--rule);
                    }

                    .invoice-root .meta-block.accent { border-left-color: var(--gold); }

                    .invoice-root .meta-block-title {
                      font-size: 9px;
                      font-weight: 600;
                      letter-spacing: 3px;
                      text-transform: uppercase;
                      color: var(--ink-soft);
                      margin-bottom: 12px;
                      margin-top: 0;
                    }

                    .invoice-root .meta-line { display: flex; gap: 12px; 
                      font-size: 13px;
                      color: var(--ink-mid);
                      font-weight: 300;
                      line-height: 1.8;
                      margin: 0;
                    }

                    .invoice-root .meta-line strong {
                      font-weight: 500;
                      color: var(--ink);
                    }
                    .invoice-root .meta-block:not(.accent) .meta-line strong {
                      min-width: 80px;
                    }

                    /* ── SECTION LABEL ── */
                    .invoice-root .section-label {
                      font-size: 10px;
                      font-weight: 600;
                      letter-spacing: 3.5px;
                      text-transform: uppercase;
                      color: var(--ink-soft);
                      display: flex;
                      align-items: center;
                      gap: 14px;
                      margin-bottom: 16px;
                      margin-top: 0;
                    }

                    .invoice-root .section-label::after {
                      content: '';
                      flex: 1;
                      height: 1px;
                      background: var(--rule);
                    }

                    /* ── LINE ITEMS TABLE ── */
                    .invoice-root .items-table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 0;
                      text-indent: 0;
                    }

                    .invoice-root .items-table thead tr {
                      border-bottom: 1px solid var(--ink);
                    }

                    .invoice-root .items-table thead th {
                      font-size: 9px;
                      font-weight: 600;
                      letter-spacing: 2.5px;
                      text-transform: uppercase;
                      color: var(--ink-soft);
                      padding: 0 0 12px;
                      text-align: left;
                    }

                    .invoice-root .items-table thead th:last-child { text-align: right; }
                    .invoice-root .items-table thead th.center { text-align: center; }

                    .invoice-root .items-table tbody tr {
                      border-bottom: 1px solid var(--rule);
                    }

                    .invoice-root .items-table tbody tr:last-child {
                      border-bottom: none;
                    }

                    .invoice-root .items-table tbody td {
                      padding: 14px 0;
                      font-size: 13.5px;
                      color: var(--ink-mid);
                      font-weight: 300;
                      vertical-align: top;
                    }

                    .invoice-root .items-table tbody td:last-child {
                      text-align: right;
                      font-weight: 400;
                      color: var(--ink);
                    }

                    .invoice-root .items-table tbody td.center { text-align: center; }

                    .invoice-root .item-name {
                      font-weight: 500;
                      color: var(--ink);
                      margin-bottom: 2px;
                      margin-top: 0;
                    }

                    .invoice-root .item-desc {
                      font-size: 12px;
                      color: var(--ink-soft);
                      font-weight: 300;
                      line-height: 1.5;
                      margin: 0;
                    }

                    /* ── TOTALS ── */
                    .invoice-root .totals-wrap {
                      margin-top: 4px;
                      display: flex;
                      justify-content: flex-end;
                    }

                    .invoice-root .totals-block {
                      width: 350px;
                      border-top: 1px solid var(--rule);
                      padding-top: 16px;
                    }

                    .invoice-root .totals-row {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      font-size: 13px;
                      color: var(--ink-soft);
                      font-weight: 300;
                      padding: 5px 0;
                    }

                    .invoice-root .totals-row span:last-child {
                      white-space: nowrap;
                      text-align: right;
                    }

                    .invoice-root .totals-row.discount { color: var(--green); }

                    .invoice-root .totals-row.grand {
                      border-top: 2px solid var(--ink);
                      margin-top: 10px;
                      padding-top: 14px;
                      font-size: 15px;
                      font-weight: 500;
                      color: var(--ink);
                    }

                    .invoice-root .totals-row.grand .amount {
                      font-family: 'Cormorant Garamond', serif;
                      font-size: 28px;
                      font-weight: 400;
                      color: var(--ink);
                      line-height: 1;
                    }

                    .invoice-root .totals-row.deposit-due {
                      margin-top: 6px;
                      padding: 10px 12px;
                      background: var(--warm-white);
                      border-left: 3px solid var(--gold);
                      font-weight: 400;
                      color: var(--ink-mid);
                    }

                    .invoice-root .totals-row.deposit-due .amount {
                      font-family: 'Cormorant Garamond', serif;
                      font-size: 20px;
                      font-weight: 400;
                      color: var(--gold);
                      line-height: 1;
                    }

                    .invoice-root .totals-row.balance-due {
                      padding: 8px 0;
                      font-weight: 400;
                      color: var(--ink-mid);
                    }

                    /* ── PAYMENT SECTION ── */
                    .invoice-root .payment {
                      margin-top: 48px;
                      padding: 28px 32px;
                      background: var(--warm-white);
                      border-top: 2px solid var(--ink);
                    }

                    .invoice-root .payment-title {
                      font-size: 10px;
                      font-weight: 600;
                      letter-spacing: 3px;
                      text-transform: uppercase;
                      color: var(--ink);
                      margin-bottom: 16px;
                      margin-top: 0;
                    }

                    .invoice-root .payment-grid {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 4px 40px;
                      font-size: 13px;
                      color: var(--ink-soft);
                      font-weight: 300;
                    }

                    .invoice-root .payment-grid > div {
                      margin: 0;
                      word-break: break-word;
                    }

                    /* ── NOTE ── */
                    .invoice-root .note {
                      margin-top: 28px;
                      padding: 18px 24px;
                      border-left: 3px solid var(--gold);
                      background: #fff;
                    }

                    .invoice-root .note-label {
                      font-size: 9px;
                      font-weight: 600;
                      letter-spacing: 2.5px;
                      text-transform: uppercase;
                      color: var(--gold);
                      margin-bottom: 8px;
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      margin-top: 0;
                    }

                    .invoice-root .note-label::before { content: '✦'; font-size: 8px; }

                    .invoice-root .note-body {
                      font-size: 13px;
                      color: var(--ink-mid);
                      font-weight: 400;
                      line-height: 1.7;
                      margin: 0;
                    }

                    /* ── SIGNATURE ── */
                    .invoice-root .signature {
                      margin-top: 48px;
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 40px;
                    }

                    .invoice-root .sig-block {
                      padding-top: 16px;
                      border-top: 1px solid var(--rule);
                    }

                    .invoice-root .sig-label {
                      font-size: 9px;
                      font-weight: 600;
                      letter-spacing: 2.5px;
                      text-transform: uppercase;
                      color: var(--ink-soft);
                      margin-bottom: 32px;
                      margin-top: 0;
                    }

                    .invoice-root .sig-line {
                      border-bottom: 1px solid var(--ink-soft);
                      margin-bottom: 6px;
                    }

                    .invoice-root .sig-name {
                      font-size: 12px;
                      color: var(--ink-soft);
                      font-weight: 300;
                      margin: 0;
                    }

                    /* ── FOOTER ── */
                    .invoice-root .footer {
                      margin-top: 52px;
                      padding-top: 24px;
                      border-top: 1px solid var(--rule);
                      text-align: center;
                    }

                    .invoice-root .footer-name {
                      font-family: 'Cormorant Garamond', serif;
                      font-size: 16px;
                      font-weight: 400;
                      letter-spacing: 3px;
                      text-transform: uppercase;
                      color: var(--ink);
                      margin-bottom: 5px;
                      margin-top: 0;
                    }

                    .invoice-root .footer-contact {
                      font-size: 12px;
                      font-weight: 300;
                      color: var(--ink-soft);
                      letter-spacing: 0.5px;
                      line-height: 1.9;
                      margin: 0;
                    }

                    @media print {
                      .invoice-root { background: white; box-shadow: none; font-size: 90% }
                      .invoice-root .page { padding: 0 32px; max-width: 100%; }
                    }

                    @media (max-width: 640px) {
                      .invoice-root:not(.pdf-export) .page { padding: 32px 20px 48px; }
                      .invoice-root:not(.pdf-export) .header h1 { font-size: 36px; }
                      .invoice-root:not(.pdf-export) .meta-wrap { grid-template-columns: 1fr; gap: 16px; margin-bottom: 32px; }
                      .invoice-root:not(.pdf-export) .meta-block { padding: 20px; }
                      
                      /* Responsive Table */
                      .invoice-root:not(.pdf-export) .items-table,
                      .invoice-root:not(.pdf-export) .items-table tbody,
                      .invoice-root:not(.pdf-export) .items-table tr,
                      .invoice-root:not(.pdf-export) .items-table td { display: block; width: 100%; }
                      .invoice-root:not(.pdf-export) .items-table thead { display: none; }
                      .invoice-root:not(.pdf-export) .items-table tr { padding: 20px 0; border-bottom: 1px solid var(--rule) !important; }
                      .invoice-root:not(.pdf-export) .items-table td { padding: 6px 0; text-align: left !important; border: none !important; }
                      .invoice-root:not(.pdf-export) .items-table td:nth-child(1) { padding-bottom: 12px; }
                      .invoice-root:not(.pdf-export) .items-table td:nth-child(2)::before { content: "Qty: "; color: var(--ink-soft); font-size: 13px; margin-right: 4px; }
                      .invoice-root:not(.pdf-export) .items-table td:nth-child(3)::before { content: "Price: "; color: var(--ink-soft); font-size: 13px; margin-right: 4px; }
                      .invoice-root:not(.pdf-export) .items-table td:nth-child(4) { margin-top: 8px; padding-top: 12px; border-top: 1px dashed var(--rule) !important; font-weight: 500; font-size: 15px; font-family: 'Cormorant Garamond', serif; }
                      .invoice-root:not(.pdf-export) .items-table td:nth-child(4)::before { content: "Total "; font-family: 'Jost', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--ink-soft); margin-right: 8px; font-weight: 600; }
                      
                      .invoice-root:not(.pdf-export) .totals-wrap { justify-content: flex-start; }
                      .invoice-root:not(.pdf-export) .totals-block { width: 100%; border-top: none; padding-top: 12px; }
                      .invoice-root:not(.pdf-export) .payment { padding: 20px; }
                      .invoice-root:not(.pdf-export) .payment-grid { grid-template-columns: 1fr; gap: 12px; }
                      .invoice-root:not(.pdf-export) .signature { grid-template-columns: 1fr; gap: 24px; }
                    }
                  ` }} />
                  <div ref={invoiceRef} className={`invoice-root theme-${getResolvedTheme(settings.documentTheme, settings.companyEmail)} max-w-[760px] mx-auto`}>
                    <div className="page">
                      
                      {/* HEADER */}
                      <header className="header">
                        <div className="header-left">
                          <div className="studio-name">{settings.companyName || 'Mwabonje Photography'}</div>
                          <div className="studio-tagline">{settings.companyAddress || 'Malindi, Kenya'}</div>
                        </div>
                        <div className="header-right">
                          <div className="invoice-label">In<em>voice</em></div>
                          <div className="invoice-number">INV · {previewInvoice.date ? format(new Date(previewInvoice.date), 'yyyy') : new Date().getFullYear()} · {previewInvoice.id.slice(0, 3).toUpperCase()}</div>
                          <div className={`status-badge ${previewInvoice.amountPaid === 0 ? 'status-unpaid' : previewInvoice.amountPaid < previewInvoice.totalAmount ? 'status-partial' : 'status-paid'}`}>
                            {previewInvoice.amountPaid === 0 ? 'Awaiting Payment' : previewInvoice.amountPaid < previewInvoice.totalAmount ? 'Partially Paid' : 'Paid in Full'}
                          </div>
                        </div>
                      </header>

                      {/* META */}
                      <div className="meta-wrap">

                        <div className="meta-block accent">
                          <div className="meta-block-title">Billed To</div>
                          <div className="meta-line"><strong>{client?.name || 'Client Name'}</strong></div>
                          {client?.email && <div className="meta-line">{client.email}</div>}
                          {client?.phone && <div className="meta-line">{client.phone}</div>}
                          <div className="meta-line">—</div>
                        </div>

                        <div className="meta-block">
                          <div className="meta-block-title">Invoice Details</div>
                          <div className="meta-line"><strong>Invoice No.</strong> <span>{previewInvoice.quoteId ? (quotes.find(q => q.id === previewInvoice.quoteId)?.quoteNumber || previewInvoice.quoteId.slice(0, 8).toUpperCase()) : previewInvoice.id.slice(0, 8).toUpperCase()}</span></div>
                          <div className="meta-line"><strong>Issue Date</strong> <span>{previewInvoice.date ? format(new Date(previewInvoice.date), 'dd · MM · yyyy') : 'N/A'}</span></div>
                          {previewInvoice.dueDate && <div className="meta-line"><strong>Due Date</strong> <span>{format(new Date(previewInvoice.dueDate), 'dd · MM · yyyy')}</span></div>}
                          {project?.title && <div className="meta-line"><strong>Project</strong> <span>{project.title}</span></div>}
                        </div>

                      </div>

                      {/* LINE ITEMS */}
                      <div className="section-label">Services</div>

                      <table className="items-table mb-12">
                        <thead>
                          <tr>
                            <th style={{ width: '55%' }}>Description</th>
                            <th className="center" style={{ width: '15%' }}>Qty</th>
                            <th style={{ width: '15%', textAlign: 'right', whiteSpace: 'nowrap' }}>Unit Price</th>
                            <th style={{ width: '15%', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(previewInvoice.lineItems || []).map((item, index) => (
                            <tr key={index}>
                              <td>
                                {renderDescription(item.description)}
                              </td>
                              <td className="center">1</td>
                              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>KES {(item.price || 0).toLocaleString()}</td>
                               <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>KES {(item.price || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* TOTALS */}
                      <div className="totals-wrap">
                        <div className="totals-block">
                          <div className="totals-row">
                            <span>Subtotal</span>
                            <span>KES {previewInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                          {previewInvoice.amountPaid > 0 && (
                            <div className="totals-row discount">
                              <span>Amount Paid</span>
                              <span>-KES {previewInvoice.amountPaid.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="totals-row grand">
                            <span>Total</span>
                            <span className="amount">KES {previewInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                          {balance > 0 && (
                            <div className="totals-row deposit-due">
                              <span>Balance Due</span>
                              <span className="amount">KES {balance.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PAYMENT DETAILS */}
                      {settings.paymentDetails && (
                        <div className="payment">
                          <div className="payment-title">Payment Details</div>
                          <div className="payment-grid">
                            {(() => {
                              const lines = settings.paymentDetails
                                .split('\n')
                                .filter(line => line.trim());
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

                      {/* SIGNATURE */}
                      <div className="signature">
                        <div className="sig-block">
                          <div className="sig-label">Authorised — {settings.companyName || 'Photography Studio'}</div>
                          <div className="sig-line"></div>
                          <div className="sig-name">{settings.ownerName || settings.companyName || ''}</div>
                        </div>
                        <div className="sig-block">
                          <div className="sig-label">Client Acknowledgement</div>
                          <div className="sig-line"></div>
                          <div className="sig-name">{client?.name || 'Client'}</div>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <footer className="footer">
                        <div className="footer-name">{settings.companyName || 'Photography Studio'}</div>
                        <div className="footer-contact">
                          {settings.companyEmail} {settings.companyAddress ? `· ${settings.companyAddress}` : ''}<br/>
                          {settings.companyWebsite} {settings.companyPhone ? `· ${settings.companyPhone}` : ''}
                        </div>
                      </footer>

                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                [...invoices].filter(invoice => {
                  if (invoice.quoteId && invoice.quoteId !== 'none') {
                    const quote = quotes.find(q => q.id === invoice.quoteId);
                    if (quote && quote.status === 'declined') {
                      return false;
                    }
                  }
                  return true;
                }).sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  if (dateB !== dateA) return dateB - dateA;
                  return b.id.localeCompare(a.id);
                }).map((invoice) => {
                  const project = projects.find(p => p.id === invoice.projectId);
                  const client = clients.find(c => c.id === invoice.clientId);
                  const balance = invoice.totalAmount - invoice.amountPaid;
                  
                  return (
                    <TableRow 
                      key={invoice.id} 
                      className={highlightedId === invoice.id ? "bg-slate-100 ring-2 ring-slate-400 ring-inset transition-all duration-500" : ""}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {invoice.quoteId ? (quotes.find(q => q.id === invoice.quoteId)?.quoteNumber || invoice.quoteId.substring(0, 8).toUpperCase()) : invoice.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">{client?.name || 'Unknown Client'}</TableCell>
                      <TableCell>{project?.title || 'Unknown Project'}</TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-semibold">KES {invoice.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-red-600">
                        {balance > 0 ? `KES ${balance.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenPreview(invoice)} title="Preview Invoice">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setPendingAction({ type: 'duplicate', invoice })} title="Duplicate Invoice">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setPendingAction({ type: 'edit', invoice })} title="Edit Invoice">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setInvoiceToDelete(invoice.id)}>
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
        isOpen={!!invoiceToDelete}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete);
            setInvoiceToDelete(null);
          }
        }}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
      />

      <ConfirmDeleteDialog
        isOpen={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          const { type, invoice } = pendingAction;
          setPendingAction(null);

          if (type === "duplicate") {
            handleDuplicateInvoice(invoice);
          } else if (type === "edit") {
            handleOpenDialog(invoice);
          }
        }}
        title={
          pendingAction?.type === "duplicate"
            ? "Duplicate Invoice"
            : "Edit Invoice"
        }
        description={
          pendingAction?.type === "duplicate"
            ? "Are you sure you want to create a duplicate of this invoice?"
            : "Are you sure you want to edit this invoice?"
        }
        confirmText="Proceed"
        isDestructive={false}
      />
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { useStore, Payment, CollaboratorSplit } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Edit, Eye, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export function Payments() {
  const { payments, invoices, clients, projects, settings, addPayment, updatePayment, deletePayment, updateProject } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorSplit[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'method'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    method: 'mpesa' as Payment['method'],
    reference: '',
  });

  const availableInvoices = invoices.filter(i => i.status !== 'paid' || i.id === formData.invoiceId);

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPaymentId(payment.id);
      setFormData({
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference || '',
      });
      const invoice = invoices.find(i => i.id === payment.invoiceId);
      if (invoice) {
        const project = projects.find(p => p.id === invoice.projectId);
        setCollaborators(project?.collaborators || []);
      } else {
        setCollaborators([]);
      }
    } else {
      setEditingPaymentId(null);
      setFormData({
        invoiceId: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        method: 'mpesa',
        reference: '',
      });
      setCollaborators([]);
    }
    setIsDialogOpen(true);
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      const balance = invoice.totalAmount - invoice.amountPaid;
      setFormData({ ...formData, invoiceId, amount: balance });
      
      const project = projects.find(p => p.id === invoice.projectId);
      if (project) {
        setCollaborators(project.collaborators || []);
      } else {
        setCollaborators([]);
      }
    }
  };

  const addCollaborator = () => {
    setCollaborators([...collaborators, { id: crypto.randomUUID(), name: '', splitType: 'equal' }]);
  };

  const updateCollaborator = (id: string, field: keyof CollaboratorSplit, value: any) => {
    setCollaborators(collaborators.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPaymentId) {
        const updatedPayment: Partial<Payment> = {
          invoiceId: formData.invoiceId,
          amount: Number(formData.amount),
          date: formData.date,
          method: formData.method,
          reference: formData.reference,
        };
        await updatePayment(editingPaymentId, updatedPayment);
        
        // Update project collaborators if they changed
        const invoice = invoices.find(i => i.id === formData.invoiceId);
        if (invoice) {
          const project = projects.find(p => p.id === invoice.projectId);
          if (project) {
            await updateProject(project.id, { collaborators });
          }
        }
        
        setIsDialogOpen(false);
        return;
      }

      const newPayment: Payment = {
        id: crypto.randomUUID(),
        invoiceId: formData.invoiceId,
        amount: Number(formData.amount),
        date: formData.date,
        method: formData.method,
        reference: formData.reference,
      };
      
      await addPayment(newPayment);
      
      // Update project collaborators if they changed
      const invoice = invoices.find(i => i.id === formData.invoiceId);
      if (invoice) {
        const project = projects.find(p => p.id === invoice.projectId);
        if (project) {
          await updateProject(project.id, { collaborators });
        }
      }
      
      // Auto-generate receipt
      setTimeout(() => {
        generateReceipt(newPayment, 'download');
      }, 500);
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Failed to save payment. Please check your connection and try again.");
    }
  };

  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generateReceipt = async (payment: Payment, mode: 'download' | 'preview' = 'download') => {
    if (mode === 'preview') {
      setPreviewPayment(payment);
      setIsPreviewOpen(true);
      return;
    }

    // PDF Download mode
    if (!receiptRef.current || isGeneratingPDF) {
       // If the receipt component isn't mounted yet, we mount it via preview first, 
       // but here we just preview and then the user can download. OR we can just open preview and let them download.
       setPreviewPayment(payment);
       setIsPreviewOpen(true);
       return;
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || isGeneratingPDF || !previewPayment) return;
    
    setIsGeneratingPDF(true);
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const element = receiptRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-[760px]', '').replace('w-full', '');
      element.style.width = '680px';
      element.style.minWidth = '680px';
      element.style.maxWidth = '680px';
      element.style.margin = '0px';
      element.style.padding = '0px';
      element.style.boxShadow = 'none';

      // Allow layout to recalculate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const invoice = invoices.find(i => i.id === previewPayment.invoiceId);
      const project = projects.find(p => p.id === invoice?.projectId);
      const safeTitle = (project?.title || 'Receipt').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      const htmlToImage = await import('html-to-image');
      const jsPDFModule = await import('jspdf');
      const jsPDF = ('default' in jsPDFModule ? jsPDFModule.default : jsPDFModule) as any;

      const dataUrl = await htmlToImage.toPng(element, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#FAF8F4',
        width: 680,
        style: {
          margin: '0',
          padding: '0',
          maxWidth: '680px',
          width: '680px',
          boxShadow: 'none',
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeightOriginal = (element.offsetHeight * pdfWidth) / 680;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let position = 0;
      while (position < pdfHeightOriginal) {
        pdf.addImage(
          dataUrl,
          'PNG',
          0,
          position * -1,
          pdfWidth,
          pdfHeightOriginal
        );
        position += pageHeight;
        if (position < pdfHeightOriginal) {
          pdf.addPage();
        }
      }
      pdf.save(`Receipt_${previewPayment.id.substring(0, 6)}.pdf`);
      
      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      window.scrollTo(0, originalScrollPos);
      setIsGeneratingPDF(false);
    }
  };

  const handleSort = (field: 'date' | 'amount' | 'method') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Payments & Receipts</h2>
        <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPaymentId ? 'Edit Payment' : 'Record New Payment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice">Invoice</Label>
                <Select
                  value={formData.invoiceId}
                  onValueChange={handleInvoiceSelect}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an unpaid invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInvoices.length === 0 ? (
                      <SelectItem value="none" disabled>No available invoices</SelectItem>
                    ) : (
                      availableInvoices.map((invoice) => {
                        const project = projects.find(p => p.id === invoice.projectId);
                        const client = clients.find(c => c.id === invoice.clientId);
                        const balance = invoice.totalAmount - invoice.amountPaid;
                        // If editing, the balance should technically include the current payment amount back, 
                        // but for simplicity we'll just show the current balance.
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {client?.name} - {project?.title} (Bal: KES {balance.toLocaleString()})
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value: any) => setFormData({ ...formData, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.method !== 'cash' && (
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference / M-Pesa Code</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder={formData.method === 'mpesa' ? 'e.g. QWE123RTY4' : 'Transaction Reference'}
                  />
                </div>
              )}

              {formData.invoiceId && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label>Payment Split (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCollaborator}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Split
                    </Button>
                  </div>
                  {collaborators.length > 0 && (
                    <div className="space-y-3">
                      {collaborators.map((collab) => (
                        <div key={collab.id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder="Name"
                              value={collab.name}
                              onChange={(e) => updateCollaborator(collab.id, 'name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="w-32">
                            <Select
                              value={collab.splitType}
                              onValueChange={(value: any) => updateCollaborator(collab.id, 'splitType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equal">Equal</SelectItem>
                                <SelectItem value="percentage">%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {collab.splitType === 'percentage' && (
                            <div className="w-24">
                              <Input
                                type="number"
                                placeholder="%"
                                min="0"
                                max="100"
                                value={collab.percentage || ''}
                                onChange={(e) => updateCollaborator(collab.id, 'percentage', Number(e.target.value))}
                                required
                              />
                            </div>
                          )}
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeCollaborator(collab.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!formData.invoiceId}>
                  {editingPaymentId ? 'Update Payment' : 'Save Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receipt Preview</DialogTitle>
            </DialogHeader>
            {previewPayment && (
              <div className="w-full bg-[#FAF8F4] overflow-x-auto">
                <style dangerouslySetInnerHTML={{ __html: `
                  .receipt-root {
                    --cream: #FAF8F4;
                    --warm-white: #F5F2EC;
                    --gold: #B8965A;
                    --gold-light: #D4AC6E;
                    --ink: #1C1C1C;
                    --ink-mid: #3A3A3A;
                    --ink-soft: #888880;
                    --rule: #DDD8CE;
                    --green: #2E7D52;
                    --green-bg: #E8F4EC;
                    --green-border: #A8D8B4;
                    background: var(--cream);
                    color: var(--ink);
                    font-family: 'Jost', sans-serif;
                    font-weight: 300;
                    line-height: 1.6;
                    text-align: left;
                  }

                  .receipt-root * { box-sizing: border-box; }

                  .receipt-root .page {
                    max-width: 680px;
                    margin: 0 auto;
                    padding: 64px 48px 80px;
                  }

                  /* ── HEADER ── */
                  .receipt-root .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-bottom: 36px;
                    border-bottom: 1px solid var(--rule);
                    margin-bottom: 36px;
                    margin-top: 0;
                  }

                  .receipt-root .studio-name {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 20px;
                    font-weight: 400;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: var(--ink);
                    margin-bottom: 4px;
                  }

                  .receipt-root .studio-tagline {
                    font-size: 10px;
                    font-weight: 400;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--gold);
                  }

                  .receipt-root .header-right { text-align: right; }

                  .receipt-root .receipt-label {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 40px;
                    font-weight: 300;
                    color: var(--ink);
                    line-height: 1;
                    letter-spacing: -1px;
                  }

                  .receipt-root .receipt-label em {
                    font-style: italic;
                    color: var(--gold);
                  }

                  .receipt-root .receipt-number {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 2px;
                    color: var(--ink-soft);
                    margin-top: 6px;
                  }

                  /* ── PAID STAMP ── */
                  .receipt-root .paid-stamp {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                    padding: 5px 16px;
                    background: var(--green-bg);
                    border: 1px solid var(--green-border);
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: var(--green);
                  }

                  .receipt-root .paid-stamp::before {
                    content: '✓';
                    font-size: 12px;
                    font-weight: 700;
                  }

                  /* ── META ── */
                  .receipt-root .meta-wrap {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 44px;
                  }

                  .receipt-root .meta-block {
                    padding: 20px 24px;
                    background: var(--warm-white);
                    border-left: 3px solid var(--rule);
                  }

                  .receipt-root .meta-block.accent { border-left-color: var(--gold); }

                  .receipt-root .meta-block-title {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin-bottom: 10px;
                  }

                  .receipt-root .meta-line {
                    font-size: 13px;
                    color: var(--ink-mid);
                    font-weight: 300;
                    line-height: 1.85;
                  }

                  .receipt-root .meta-line strong {
                    font-weight: 500;
                    color: var(--ink);
                  }

                  /* ── SECTION LABEL ── */
                  .receipt-root .section-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 3.5px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 16px;
                  }

                  .receipt-root .section-label::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: var(--rule);
                  }

                  /* ── LINE ITEMS ── */
                  .receipt-root .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 0;
                  }

                  .receipt-root .items-table thead tr {
                    border-bottom: 1px solid var(--ink);
                  }

                  .receipt-root .items-table thead th {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    padding: 0 0 10px;
                    text-align: left;
                  }

                  .receipt-root .items-table thead th:last-child { text-align: right; }

                  .receipt-root .items-table tbody tr {
                    border-bottom: 1px solid var(--rule);
                  }

                  .receipt-root .items-table tbody tr:last-child { border-bottom: none; }

                  .receipt-root .items-table tbody td {
                    padding: 13px 0;
                    font-size: 13.5px;
                    color: var(--ink-mid);
                    font-weight: 300;
                    vertical-align: top;
                  }

                  .receipt-root .items-table tbody td:last-child {
                    text-align: right;
                    font-weight: 400;
                    color: var(--ink);
                  }

                  .receipt-root .item-name {
                    font-weight: 500;
                    color: var(--ink);
                    margin-bottom: 2px;
                  }

                  .receipt-root .item-desc {
                    font-size: 12px;
                    color: var(--ink-soft);
                    line-height: 1.5;
                  }

                  /* ── TOTALS ── */
                  .receipt-root .totals-wrap {
                    margin-top: 6px;
                    display: flex;
                    justify-content: flex-end;
                  }

                  .receipt-root .totals-block {
                    width: 280px;
                    border-top: 1px solid var(--rule);
                    padding-top: 14px;
                  }

                  .receipt-root .totals-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: var(--ink-soft);
                    font-weight: 300;
                    padding: 4px 0;
                  }

                  .receipt-root .totals-row.grand {
                    border-top: 2px solid var(--ink);
                    margin-top: 10px;
                    padding-top: 14px;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--ink);
                  }

                  .receipt-root .totals-row.grand .amount {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 28px;
                    font-weight: 400;
                    line-height: 1;
                    color: var(--ink);
                  }

                  .receipt-root .totals-row.amount-paid {
                    margin-top: 8px;
                    padding: 10px 14px;
                    background: var(--green-bg);
                    border-left: 3px solid var(--green);
                    font-weight: 500;
                    color: var(--green);
                  }

                  .receipt-root .totals-row.amount-paid .amount {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 20px;
                    font-weight: 400;
                    line-height: 1;
                    color: var(--green);
                  }

                  .receipt-root .totals-row.balance {
                    padding: 6px 0;
                    font-weight: 400;
                    color: var(--ink-mid);
                    border-top: 1px dashed var(--rule);
                    margin-top: 6px;
                  }

                  /* ── PAYMENT METHOD ── */
                  .receipt-root .payment-method {
                    margin-top: 44px;
                    padding: 24px 28px;
                    background: var(--warm-white);
                    border-top: 2px solid var(--ink);
                  }

                  .receipt-root .payment-method-title {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: var(--ink);
                    margin-bottom: 14px;
                  }

                  .receipt-root .payment-method-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px 40px;
                    font-size: 13px;
                    color: var(--ink-soft);
                    font-weight: 300;
                  }

                  .receipt-root .payment-method-grid strong {
                    font-weight: 500;
                    color: var(--ink-mid);
                  }

                  /* ── THANK YOU ── */
                  .receipt-root .thankyou {
                    margin-top: 44px;
                    text-align: center;
                    padding: 32px 24px;
                    border: 1px solid var(--rule);
                    background: #fff;
                  }

                  .receipt-root .thankyou-heading {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 28px;
                    font-weight: 300;
                    font-style: italic;
                    color: var(--gold);
                    margin-bottom: 6px;
                  }

                  .receipt-root .thankyou-body {
                    font-size: 13px;
                    color: var(--ink-soft);
                    font-weight: 300;
                    line-height: 1.7;
                  }

                  /* ── SIGNATURE ── */
                  .receipt-root .signature {
                    margin-top: 44px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                  }

                  .receipt-root .sig-block { padding-top: 14px; border-top: 1px solid var(--rule); }

                  .receipt-root .sig-label {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin-bottom: 30px;
                  }

                  .receipt-root .sig-line {
                    border-bottom: 1px solid var(--ink-soft);
                    margin-bottom: 6px;
                  }

                  .receipt-root .sig-name {
                    font-size: 12px;
                    color: var(--ink-soft);
                    font-weight: 300;
                  }

                  /* ── FOOTER ── */
                  .receipt-root .footer {
                    margin-top: 48px;
                    padding-top: 22px;
                    border-top: 1px solid var(--rule);
                    text-align: center;
                  }

                  .receipt-root .footer-name {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 15px;
                    font-weight: 400;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: var(--ink);
                    margin-bottom: 5px;
                  }

                  .receipt-root .footer-contact {
                    font-size: 12px;
                    font-weight: 300;
                    color: var(--ink-soft);
                    letter-spacing: 0.5px;
                    line-height: 1.9;
                  }

                  @media print {
                    .receipt-root { background: white; }
                    .receipt-root .page { padding: 32px; }
                  }
                ` }} />
                
                {(() => {
                  const invoice = invoices.find(i => i.id === previewPayment.invoiceId);
                  const project = projects.find(p => p.id === invoice?.projectId);
                  const client = clients.find(c => c.id === invoice?.clientId);
                  const balance = invoice ? invoice.totalAmount - invoice.amountPaid : 0;
                  
                  const renderDescription = (description: string) => {
                    if (!description) return <div className="item-name">Item description</div>;
                    const match = description.match(/^(.*?)\s*\((.*)\)$/);
                    if (match) {
                      const [_, title, inclusionsStr] = match;
                      const inclusions = inclusionsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
                      return (
                        <>
                          <div className="item-name">{title}</div>
                          {inclusions.length > 0 && (
                            <div className="item-desc">
                              {inclusions.join(' · ')}
                            </div>
                          )}
                        </>
                      );
                    }
                    return <div className="item-name">{description}</div>;
                  };

                  return (
                    <div ref={receiptRef} className="receipt-root w-full mx-auto max-w-[760px] pb-10">
                      <div className="page">
                        
                        {/* HEADER */}
                        <header className="header">
                          <div className="header-left">
                            <div className="studio-name">{settings?.companyName || 'Mwabonje Photography'}</div>
                            <div className="studio-tagline">{settings?.companyAddress || 'Malindi, Kenya'}</div>
                          </div>
                          <div className="header-right">
                            <div className="receipt-label">Re<em>ceipt</em></div>
                            <div className="paid-stamp">Payment Received</div>
                          </div>
                        </header>

                        {/* META */}
                        <div className="meta-wrap">
                          <div className="meta-block accent">
                            <div className="meta-block-title">Received From</div>
                            <div className="meta-line"><strong>{client?.name || 'Client'}</strong></div>
                            {(client?.address || client?.email) && <div className="meta-line">{client.address || client.email}</div>}
                          </div>

                          <div className="meta-block">
                            <div className="meta-block-title">Receipt Details</div>
                            <div className="meta-line"><strong>Receipt No.</strong> &nbsp;RCT-{previewPayment.id.substring(0, 6).toUpperCase()}</div>
                            <div className="meta-line"><strong>Date Paid</strong> &nbsp;&nbsp;&nbsp;{format(new Date(previewPayment.date), 'dd · MM · yyyy')}</div>
                            {project?.title && <div className="meta-line"><strong>Project</strong> &nbsp;&nbsp;&nbsp;&nbsp;{project.title}</div>}
                            <div className="meta-line"><strong>Ref. Invoice</strong> &nbsp;{invoice?.id.substring(0, 8).toUpperCase()}</div>
                          </div>
                        </div>

                        {/* LINE ITEMS */}
                        <div className="section-label">Payment For</div>

                        <table className="items-table">
                          <thead>
                            <tr>
                              <th style={{width: '60%'}}>Description</th>
                              <th style={{width: '20%', textAlign: 'right'}}>Package Total</th>
                              <th style={{width: '20%', textAlign: 'right'}}>Amount Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice?.lineItems.map((item: any, idx: number) => {
                              // Distribute amount paid over line items sequentially for display
                              let accumulatedOriginalAmount = 0;
                              if (idx > 0) {
                                for (let i = 0; i < idx; i++) accumulatedOriginalAmount += invoice.lineItems[i].price || 0;
                              }
                              let amountForThisItem = 0;
                              const itemPrice = item.price || 0;
                              const remainingPaymentAmount = previewPayment.amount - accumulatedOriginalAmount;
                              
                              if (remainingPaymentAmount > 0) {
                                amountForThisItem = Math.min(itemPrice, remainingPaymentAmount);
                              }

                              return (
                                <tr key={idx}>
                                  <td>
                                    {renderDescription(item.description)}
                                  </td>
                                  <td style={{textAlign: 'right'}}>KES {itemPrice.toLocaleString()}</td>
                                  <td style={{textAlign: 'right'}}>{amountForThisItem > 0 ? `KES ${amountForThisItem.toLocaleString()}` : 'KES —'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* TOTALS */}
                        <div className="totals-wrap">
                          <div className="totals-block">
                            <div className="totals-row">
                              <span>Package Total</span>
                              <span>KES {invoice?.totalAmount.toLocaleString()}</span>
                            </div>

                            <div className="totals-row grand">
                              <span>Total Due</span>
                              <span className="amount">KES {invoice?.totalAmount.toLocaleString()}</span>
                            </div>

                            <div className="totals-row amount-paid">
                              <span>Amount Received</span>
                              <span className="amount">KES {previewPayment.amount.toLocaleString()}</span>
                            </div>

                            <div className="totals-row balance">
                              <span>Balance Remaining</span>
                              <span>KES {balance.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* PAYMENT METHOD */}
                        <div className="payment-method">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 40px', marginBottom: '14px' }}>
                            <div className="payment-method-title" style={{ marginBottom: 0 }}>Payment Method</div>
                            {settings?.paymentDetails && <div className="payment-method-title" style={{ marginBottom: 0 }}>Payment Details</div>}
                          </div>
                          <div className="payment-method-grid">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div><strong>Method</strong> &nbsp; {previewPayment.method.toUpperCase()}</div>
                              <div><strong>Transaction Ref.</strong> &nbsp; {previewPayment.reference || '——————'}</div>
                              <div><strong>Received By</strong> &nbsp; {settings?.companyName || 'Mwabonje Photography'}</div>
                            </div>
                            
                            {settings?.paymentDetails && (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ lineHeight: 1.6 }}>
                                  {settings.paymentDetails.split('\n').filter(line => line.trim()).map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* THANK YOU */}
                        <div className="thankyou">
                          <div className="thankyou-heading">Thank you, {client?.name ? client.name.split(' ')[0] : 'Client'}.</div>
                          <div className="thankyou-body">
                            {balance > 0 ? (
                              <>
                                Your payment is confirmed. We look forward to capturing beautiful memories.<br/>
                                <span>The remaining balance of <strong>KES {balance.toLocaleString()}</strong> is due on the shoot day before the session begins.</span>
                              </>
                            ) : (
                              <>
                                Your payment is confirmed. Your balance is fully cleared. We appreciate you choosing us to capture your beautiful moments!
                              </>
                            )}
                          </div>
                        </div>

                        {/* SIGNATURE */}
                        <div className="signature">
                          <div className="sig-block">
                            <div className="sig-label">Issued By — {settings?.companyName || 'Mwabonje Photography'}</div>
                            <div className="sig-line"></div>
                            <div className="sig-name">{settings?.companyEmail || 'Admin'}</div>
                          </div>
                          <div className="sig-block">
                            <div className="sig-label">Client Acknowledgement</div>
                            <div className="sig-line"></div>
                            <div className="sig-name">{client?.name || 'Client'}</div>
                          </div>
                        </div>

                        {/* FOOTER */}
                        <footer className="footer">
                          <div className="footer-name">{settings?.companyName || 'Mwabonje Photography'}</div>
                          <div className="footer-contact">
                            {settings?.companyEmail} · {settings?.companyAddress || 'Malindi, Kenya'}<br/>
                            {settings?.companyWebsite} · {settings?.companyPhone}
                          </div>
                        </footer>

                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isGeneratingPDF ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Download PDF</>
                )}
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
                <TableHead>Receipt No</TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('method')}>
                  <div className="flex items-center gap-1">
                    Method
                    {sortField === 'method' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1">
                    Amount
                    {sortField === 'amount' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                [...payments].sort((a, b) => {
                  let comparison = 0;
                  if (sortField === 'date') {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    comparison = dateA - dateB;
                  } else if (sortField === 'amount') {
                    comparison = a.amount - b.amount;
                  } else if (sortField === 'method') {
                    comparison = a.method.localeCompare(b.method);
                  }
                  
                  if (comparison === 0) {
                    return b.id.localeCompare(a.id);
                  }
                  
                  return sortDirection === 'asc' ? comparison : -comparison;
                }).map((payment) => {
                  const invoice = invoices.find(i => i.id === payment.invoiceId);
                  const project = projects.find(p => p.id === invoice?.projectId);
                  const client = clients.find(c => c.id === invoice?.clientId);
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        RCT-{payment.id.substring(0, 6).toUpperCase()}
                      </TableCell>
                      <TableCell>{format(new Date(payment.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{client?.name || 'Unknown Client'}</TableCell>
                      <TableCell>{project?.title || 'Unknown Project'}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell className="font-mono text-xs">{payment.reference || '-'}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        KES {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(payment)} title="Edit Payment">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => generateReceipt(payment, 'preview')} title="Preview Receipt">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => generateReceipt(payment, 'download')} title="Download Receipt">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment.id)} title="Delete Payment">
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
        isOpen={!!paymentToDelete}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            deletePayment(paymentToDelete);
            setPaymentToDelete(null);
          }
        }}
        title="Delete Payment"
        description="Are you sure you want to delete this payment? This action cannot be undone."
      />
    </div>
  );
}

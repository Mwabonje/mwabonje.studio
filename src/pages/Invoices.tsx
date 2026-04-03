import React, { useState, useRef } from 'react';
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
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export function Invoices() {
  const { invoices, quotes, projects, clients, settings, addInvoice, updateInvoice, deleteInvoice } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
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
    try {
      const element = invoiceRef.current;
      const originalStyle = element.style.cssText;
      
      element.style.width = '800px';
      element.style.maxWidth = 'none';
      element.style.padding = '40px';

      const imgData = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '800px'
        }
      });
      
      element.style.cssText = originalStyle;
      
      const JSPDF = typeof jsPDF === 'function' ? jsPDF : (jsPDF as any).jsPDF || (jsPDF as any).default;
      const pdf = new JSPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = pdfWidth / imgProps.width;
      const totalPdfHeight = imgProps.height * ratio;
      
      let heightLeft = totalPdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - totalPdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
        heightLeft -= pdfHeight;
      }

      const project = projects.find(p => p.id === previewInvoice.projectId);
      const safeTitle = (project?.title || 'Invoice').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`Invoice_${safeTitle}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
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
    const url = `${window.location.origin}/invoice/shared?uid=${uid}&id=${previewInvoice.id}`;
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

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        quoteId: invoice.quoteId || 'none',
        projectId: invoice.projectId,
        clientId: invoice.clientId,
        date: invoice.date,
        dueDate: invoice.dueDate,
      });
      setLineItems(invoice.lineItems || []);
    } else {
      setEditingInvoice(null);
      setFormData({
        quoteId: 'none',
        projectId: '',
        clientId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
      setLineItems([]);
    }
    setIsDialogOpen(true);
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" />}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </DialogTrigger>
          <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {editingInvoice ? 'Update Invoice' : 'Save Invoice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl sm:max-w-4xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50">
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
                <div ref={invoiceRef} className="p-6 sm:p-12 m-4 sm:m-6 bg-white shadow-xl border border-slate-100 relative overflow-hidden font-sans text-slate-800">
                  {/* Decorative Top Line */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${getColorClass(settings.colorScheme)}`}></div>

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-12">
                    <div className="mb-6 sm:mb-0">
                      {settings.logoUrl && (
                        <img src={settings.logoUrl} alt="Company Logo" className="h-12 object-contain mb-6" />
                      )}
                      <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Billed To</h2>
                      <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 leading-tight">{client?.name || 'Client Name'}</h1>
                      <p className="text-sm text-slate-500 mt-1">{client?.email}</p>
                      <p className="text-sm text-slate-500">{client?.phone}</p>
                      <p className="text-base text-slate-500 mt-4 font-serif italic">{project?.title || 'Project Title'}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <h2 className="text-2xl sm:text-3xl font-serif text-slate-200 tracking-widest uppercase mb-4">Invoice</h2>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Invoice No.</p>
                        <p className="text-xs text-slate-800 mb-3 font-mono">{previewInvoice.id.substring(0, 8).toUpperCase()}</p>
                        
                        <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Issue Date</p>
                        <p className="text-xs text-slate-800 mb-3">{format(new Date(previewInvoice.date), 'MMMM d, yyyy')}</p>
                        
                        <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Due Date</p>
                        <p className="text-xs text-slate-800">{format(new Date(previewInvoice.dueDate), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-200 mb-8"></div>

                  {/* Line Items */}
                  <div className="mb-12">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-3 text-xs font-bold text-slate-900 uppercase tracking-[0.15em]">Description</th>
                          <th className="py-3 text-xs font-bold text-slate-900 uppercase tracking-[0.15em] text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewInvoice.lineItems.map((item, index) => (
                          <tr key={item.id || index} className="border-b border-slate-100">
                            <td className="py-4 text-sm text-slate-700">{item.description || 'Item description'}</td>
                            <td className="py-4 text-sm text-slate-900 font-medium text-right">KES {item.price.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-12">
                    <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="text-slate-900 font-medium">KES {previewInvoice.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Amount Paid</span>
                        <span className="text-slate-900 font-medium">KES {previewInvoice.amountPaid.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em]">Balance Due</span>
                        <span className="text-2xl font-serif text-slate-900 font-bold">KES {balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-200 mb-8"></div>

                  {/* Payment Details & Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em] mb-4">Payment Details</h3>
                      <div className="bg-slate-50 p-4 border border-slate-100 rounded text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {settings.paymentDetails}
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-auto">
                      <p className="font-bold text-slate-900 text-sm">{settings.companyName}</p>
                      {settings.companyEmail && <p className="text-xs text-slate-500">{settings.companyEmail}</p>}
                      {settings.companyPhone && <p className="text-xs text-slate-500">{settings.companyPhone}</p>}
                      {settings.companyWebsite && <p className="text-xs text-slate-500">{settings.companyWebsite}</p>}
                      {settings.companyAddress && <p className="text-xs text-slate-500 whitespace-pre-wrap mt-1">{settings.companyAddress}</p>}
                      <p className="text-xs text-slate-500 mt-2 italic">Thank you for your business.</p>
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
                invoices.map((invoice) => {
                  const project = projects.find(p => p.id === invoice.projectId);
                  const client = clients.find(c => c.id === invoice.clientId);
                  const balance = invoice.totalAmount - invoice.amountPaid;
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {invoice.id.substring(0, 8).toUpperCase()}
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
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(invoice)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteInvoice(invoice.id)}>
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
    </div>
  );
}

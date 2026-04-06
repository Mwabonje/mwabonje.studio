import React, { useState } from 'react';
import { useStore, Payment, CollaboratorSplit } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Edit, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Payments() {
  const { payments, invoices, clients, projects, settings, addPayment, updatePayment, deletePayment, updateProject } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorSplit[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'method'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
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

  const generateReceipt = (payment: Payment, mode: 'download' | 'preview' = 'download') => {
    // Get the latest invoice state if possible, or calculate based on the current payment
    const invoice = useStore.getState().invoices.find(i => i.id === payment.invoiceId);
    if (!invoice) return;
    
    const project = useStore.getState().projects.find(p => p.id === invoice.projectId);
    const client = useStore.getState().clients.find(c => c.id === invoice.clientId);
    const settings = useStore.getState().settings;
    
    const doc = new jsPDF();
    
    // Header
    const companyName = settings?.companyName?.toUpperCase() || 'MWABONJE STUDIO';
    doc.setFontSize(22);
    let fontSize = 22;
    while (doc.getTextWidth(companyName) > 110 && fontSize > 10) {
      fontSize--;
      doc.setFontSize(fontSize);
    }
    doc.setTextColor(0, 50, 35); // Primary Dark
    doc.text(companyName, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (settings?.companyAddress) doc.text(settings.companyAddress, 14, 28);
    if (settings?.companyEmail) doc.text(`Email: ${settings.companyEmail}`, 14, 33);
    
    // Receipt Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('PAYMENT RECEIPT', 196, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.text(`Receipt No: RCT-${payment.id.substring(0, 6).toUpperCase()}`, 196, 28, { align: 'right' });
    doc.text(`Date: ${format(new Date(payment.date), 'MMM d, yyyy')}`, 196, 33, { align: 'right' });
    
    // Client Info
    doc.setFontSize(12);
    doc.setTextColor(0, 50, 35);
    doc.text('Received From:', 14, 50);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(client?.name || 'Unknown Client', 14, 57);
    if (client?.email) doc.text(client.email, 14, 62);
    if (client?.phone) doc.text(client.phone, 14, 67);
    
    // Payment Details
    doc.setFontSize(12);
    doc.setTextColor(0, 50, 35);
    doc.text('Payment Details:', 14, 85);
    
    // Calculate balance based on the latest invoice state
    const balance = invoice.totalAmount - invoice.amountPaid;
    
    const bodyData = [
      ['Project', project?.title || 'Unknown Project'],
      ['Invoice No.', invoice.id.substring(0, 8).toUpperCase()],
      ['Payment Method', payment.method.toUpperCase()],
    ];

    if (payment.reference) {
      bodyData.push(['Reference / M-Pesa Code', payment.reference]);
    }

    bodyData.push(
      ['Amount Paid', `KES ${payment.amount.toLocaleString()}`],
      ['Remaining Balance', `KES ${balance.toLocaleString()}`]
    );

    autoTable(doc, {
      startY: 90,
      headStyles: { fillColor: [0, 50, 35] },
      head: [['Description', 'Details']],
      body: bodyData,
    });
    
    // Fully Paid Stamp
    if (balance <= 0) {
      doc.setFontSize(40);
      doc.setTextColor(0, 150, 0); // Green
      doc.setGState(new (doc.GState as any)({ opacity: 0.2 }));
      // Rotate and center the stamp
      doc.text('FULLY PAID', 105, 150, { align: 'center', angle: 45 });
      doc.setGState(new (doc.GState as any)({ opacity: 1 })); // Reset opacity
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    if (mode === 'preview') {
      setPreviewPayment(payment);
      setIsPreviewOpen(true);
    } else {
      doc.save(`Receipt_${payment.id.substring(0, 6)}.pdf`);
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
              <div className="mt-4 p-4 sm:p-8 bg-white border rounded-lg shadow-sm font-sans text-slate-800 overflow-x-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4 sm:gap-0">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">{settings?.companyName?.toUpperCase() || 'MWABONJE STUDIO'}</h1>
                    {settings?.companyAddress && <p className="text-sm text-slate-500 mt-1">{settings.companyAddress}</p>}
                    {settings?.companyEmail && <p className="text-sm text-slate-500">Email: {settings.companyEmail}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 uppercase tracking-wider">Payment Receipt</h2>
                    <p className="text-sm text-slate-500 mt-2">Receipt No: <span className="font-mono text-slate-800">RCT-{previewPayment.id.substring(0, 6).toUpperCase()}</span></p>
                    <p className="text-sm text-slate-500">Date: <span className="text-slate-800">{format(new Date(previewPayment.date), 'MMM d, yyyy')}</span></p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Received From</h3>
                  {(() => {
                    const invoice = invoices.find(i => i.id === previewPayment.invoiceId);
                    const client = clients.find(c => c.id === invoice?.clientId);
                    return (
                      <div>
                        <p className="font-medium text-slate-800">{client?.name || 'Unknown Client'}</p>
                        {client?.email && <p className="text-sm text-slate-500">{client.email}</p>}
                        {client?.phone && <p className="text-sm text-slate-500">{client.phone}</p>}
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-8 relative">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Payment Details</h3>
                  <div className="bg-slate-50 rounded-lg border overflow-x-auto">
                    <Table className="min-w-[400px]">
                      <TableHeader className="bg-primary/5">
                        <TableRow>
                          <TableHead className="text-primary font-semibold">Description</TableHead>
                          <TableHead className="text-primary font-semibold text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const invoice = invoices.find(i => i.id === previewPayment.invoiceId);
                          const project = projects.find(p => p.id === invoice?.projectId);
                          const balance = invoice ? invoice.totalAmount - invoice.amountPaid : 0;
                          
                          return (
                            <>
                              <TableRow>
                                <TableCell className="font-medium">Project</TableCell>
                                <TableCell className="text-right">{project?.title || 'Unknown Project'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Invoice No.</TableCell>
                                <TableCell className="text-right font-mono text-xs">{invoice?.id.substring(0, 8).toUpperCase()}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Payment Method</TableCell>
                                <TableCell className="text-right capitalize">{previewPayment.method}</TableCell>
                              </TableRow>
                              {previewPayment.reference && (
                                <TableRow>
                                  <TableCell className="font-medium">Reference / M-Pesa Code</TableCell>
                                  <TableCell className="text-right font-mono text-xs">{previewPayment.reference}</TableCell>
                                </TableRow>
                              )}
                              <TableRow className="bg-primary/5">
                                <TableCell className="font-bold text-primary">Amount Paid</TableCell>
                                <TableCell className="text-right font-bold text-primary">KES {previewPayment.amount.toLocaleString()}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium text-slate-500">Remaining Balance</TableCell>
                                <TableCell className="text-right text-slate-500">KES {balance.toLocaleString()}</TableCell>
                              </TableRow>
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                  {(() => {
                    const invoice = invoices.find(i => i.id === previewPayment.invoiceId);
                    const balance = invoice ? invoice.totalAmount - invoice.amountPaid : 0;
                    if (balance <= 0) {
                      return (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                          <div className="text-green-600/20 font-bold text-6xl sm:text-8xl -rotate-12 select-none border-8 border-green-600/20 rounded-xl p-4 sm:p-8">
                            FULLY PAID
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="text-center mt-12 pt-8 border-t text-sm text-slate-500 italic">
                  Thank you for your business!
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={() => previewPayment && generateReceipt(previewPayment, 'download')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
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
                        <Button variant="ghost" size="icon" onClick={() => deletePayment(payment.id)} title="Delete Payment">
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

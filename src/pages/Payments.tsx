import React, { useState } from 'react';
import { useStore, Payment } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function Payments() {
  const { payments, invoices, clients, projects, addPayment, deletePayment } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    method: 'mpesa' as Payment['method'],
  });

  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');

  const handleOpenDialog = () => {
    setFormData({
      invoiceId: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      method: 'mpesa',
    });
    setIsDialogOpen(true);
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      const balance = invoice.totalAmount - invoice.amountPaid;
      setFormData({ ...formData, invoiceId, amount: balance });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      invoiceId: formData.invoiceId,
      amount: Number(formData.amount),
      date: formData.date,
      method: formData.method,
    };
    
    addPayment(newPayment);
    
    // Auto-generate receipt
    setTimeout(() => {
      generateReceipt(newPayment);
    }, 500);
    
    setIsDialogOpen(false);
  };

  const generateReceipt = (payment: Payment) => {
    // Get the latest invoice state if possible, or calculate based on the current payment
    const invoice = useStore.getState().invoices.find(i => i.id === payment.invoiceId);
    if (!invoice) return;
    
    const project = useStore.getState().projects.find(p => p.id === invoice.projectId);
    const client = useStore.getState().clients.find(c => c.id === invoice.clientId);
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 50, 35); // Primary Dark
    doc.text('MWABONJE STUDIO', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Malindi, Kenya', 14, 28);
    doc.text('Email: hello@mwabonje.com', 14, 33);
    
    // Receipt Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('PAYMENT RECEIPT', 140, 20);
    
    doc.setFontSize(10);
    doc.text(`Receipt No: RCT-${payment.id.substring(0, 6).toUpperCase()}`, 140, 28);
    doc.text(`Date: ${format(new Date(payment.date), 'MMM d, yyyy')}`, 140, 33);
    
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
    
    (doc as any).autoTable({
      startY: 90,
      headStyles: { fillColor: [0, 50, 35] },
      head: [['Description', 'Details']],
      body: [
        ['Project', project?.title || 'Unknown Project'],
        ['Invoice No.', `INV-${invoice.id.substring(0, 6).toUpperCase()}`],
        ['Payment Method', payment.method.toUpperCase()],
        ['Amount Paid', `KES ${payment.amount.toLocaleString()}`],
        ['Remaining Balance', `KES ${balance.toLocaleString()}`],
      ],
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    doc.save(`Receipt_${payment.id.substring(0, 6)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Payments & Receipts</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={handleOpenDialog} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" />}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
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
                    {unpaidInvoices.length === 0 ? (
                      <SelectItem value="none" disabled>No unpaid invoices</SelectItem>
                    ) : (
                      unpaidInvoices.map((invoice) => {
                        const project = projects.find(p => p.id === invoice.projectId);
                        const client = clients.find(c => c.id === invoice.clientId);
                        const balance = invoice.totalAmount - invoice.amountPaid;
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!formData.invoiceId}>
                  Save Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
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
                      <TableCell className="font-semibold text-green-600">
                        KES {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => generateReceipt(payment)} className="mr-2">
                          <Download className="w-4 h-4 mr-1" /> Receipt
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePayment(payment.id)}>
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

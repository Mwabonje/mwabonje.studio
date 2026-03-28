import React, { useState } from 'react';
import { useStore, Invoice, LineItem, Quote } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function Invoices() {
  const { invoices, quotes, projects, clients, addInvoice, updateInvoice, deleteInvoice } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  const [formData, setFormData] = useState({
    quoteId: 'none',
    projectId: '',
    clientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotal();
    
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, { ...formData, lineItems, totalAmount });
    } else {
      addInvoice({
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

import React, { useState } from 'react';
import { useStore, Client } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '', nationality: '', leadSource: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, phone: client.phone, email: client.email, notes: client.notes, nationality: client.nationality || '', leadSource: client.leadSource || '' });
    } else {
      setEditingClient(null);
      setFormData({ name: '', phone: '', email: '', notes: '', nationality: '', leadSource: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await addClient({
          id: crypto.randomUUID(),
          ...formData,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client. Please check your connection and try again.");
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsNationality: Record<string, number> = {};
  const statsLeadSource: Record<string, number> = {};
  let validNationalityCount = 0;
  let validLeadSourceCount = 0;

  clients.forEach(c => {
    const nat = c.nationality?.trim() || 'Unknown';
    if (nat && nat !== 'Unknown') validNationalityCount++;
    statsNationality[nat] = (statsNationality[nat] || 0) + 1;

    const source = c.leadSource?.trim() || 'Unknown';
    if (source && source !== 'Unknown') validLeadSourceCount++;
    statsLeadSource[source] = (statsLeadSource[source] || 0) + 1;
  });

  const getPercentages = (stats: Record<string, number>, total: number) => {
    return Object.entries(stats)
      .filter(([key]) => key !== 'Unknown')
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  };

  const topNationalities = getPercentages(statsNationality, clients.length);
  const topSources = getPercentages(statsLeadSource, clients.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" />}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    list="nationalities"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="e.g. Kenya, Italy"
                  />
                  <datalist id="nationalities">
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="leadSource">Lead Source (Platform / Referral)</Label>
                  <Input
                    id="leadSource"
                    list="leadSources"
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    placeholder="e.g. Instagram, Referral"
                  />
                  <datalist id="leadSources">
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {editingClient ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {(topNationalities.length > 0 || topSources.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                Top Nationalities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topNationalities.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {topNationalities.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 w-full">
                        <span className="w-24 truncate font-medium">{item.name}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="w-12 text-right text-slate-500">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-2">No nationality data yet.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                Top Lead Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topSources.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {topSources.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 w-full">
                        <span className="w-24 truncate font-medium">{item.name}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="w-12 text-right text-slate-500">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-2">No lead source data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No clients found matching your search.' : 'No clients found. Add one to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredClients].sort((a, b) => a.name.localeCompare(b.name)).map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.nationality || '-'}</TableCell>
                    <TableCell>{client.leadSource || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{client.notes}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(client)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setClientToDelete(client.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) {
            deleteClient(clientToDelete);
            setClientToDelete(null);
          }
        }}
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
      />
    </div>
  );
}

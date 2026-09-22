import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStore, Client } from "@/store";
import { formatPhoneNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Search, Download, Mail, Phone } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ActionTooltip } from "@/components/ui/tooltip";

export function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedId = searchParams.get('highlight');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    nationality: "",
    leadSource: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleOpenDialog();
    }
  }, [location.search]);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email,
        notes: client.notes,
        nationality: client.nationality || "",
        leadSource: client.leadSource || "",
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        notes: "",
        nationality: "",
        leadSource: "",
      });
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
      alert(
        "Failed to save client. Please check your connection and try again.",
      );
    }
  };

  const handleExportCSV = () => {
    if (filteredClients.length === 0) return;

    // Use filteredClients to respect any active search
    const exportData = filteredClients;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Nationality",
      "Lead Source",
      "Notes",
    ];
    const csvContent = [
      headers.join(","),
      ...exportData.map((client) =>
        [
          `"${(client.name || "").replace(/"/g, '""')}"`,
          `"${(client.email || "").replace(/"/g, '""')}"`,
          `"${(client.phone || "").replace(/"/g, '""')}"`,
          `"${(client.nationality || "").replace(/"/g, '""')}"`,
          `"${(client.leadSource || "").replace(/"/g, '""')}"`,
          `"${(client.notes || "").replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [clients, searchQuery]);

  const sortedFilteredClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredClients]);

  const statsNationality: Record<string, number> = {};
  const statsLeadSource: Record<string, number> = {};
  let validNationalityCount = 0;
  let validLeadSourceCount = 0;

  clients.forEach((c) => {
    const nat = c.nationality?.trim() || "Unknown";
    if (nat && nat !== "Unknown") validNationalityCount++;
    statsNationality[nat] = (statsNationality[nat] || 0) + 1;

    const source = c.leadSource?.trim() || "Unknown";
    if (source && source !== "Unknown") validLeadSourceCount++;
    statsLeadSource[source] = (statsLeadSource[source] || 0) + 1;
  });

  const getPercentages = (
    stats: Record<string, number>,
    totalValid: number,
  ) => {
    let entries = Object.entries(stats)
      .filter(([key]) => key !== "Unknown")
      .map(([name, count]) => ({
        name,
        count,
        percentage: 0, // Will calculate properly
      }))
      .sort((a, b) => b.count - a.count);

    if (entries.length === 0) return [];

    // Largest Remainder Method to ensure it sums exactly to 100%
    const exactPercentages = entries.map((item) => ({
      ...item,
      exactPercentage: (item.count / totalValid) * 100,
      floorPercentage: Math.floor((item.count / totalValid) * 100),
      remainder:
        (item.count / totalValid) * 100 -
        Math.floor((item.count / totalValid) * 100),
    }));

    let currentSum = exactPercentages.reduce(
      (sum, item) => sum + item.floorPercentage,
      0,
    );
    let diff = 100 - currentSum;

    // Sort by remainder descending to distribute the remaining percentage points
    exactPercentages.sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < diff && i < exactPercentages.length; i++) {
      exactPercentages[i].floorPercentage += 1;
    }

    // Restore original order (by count descending)
    exactPercentages.sort((a, b) => b.count - a.count);

    return exactPercentages.map((item) => ({
      name: item.name,
      count: item.count,
      percentage: item.floorPercentage,
    }));
  };

  const topNationalities = getPercentages(
    statsNationality,
    validNationalityCount,
  );
  const topSources = getPercentages(statsLeadSource, validLeadSourceCount);

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
          <ActionTooltip content="Export Clients as CSV" side="bottom">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </ActionTooltip>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                />
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Edit Client" : "Add New Client"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      onBlur={(e) =>
                        setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      list="nationalities"
                      value={formData.nationality}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nationality: e.target.value,
                        })
                      }
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
                    <Label htmlFor="leadSource">
                      Lead Source (Platform / Referral)
                    </Label>
                    <Input
                      id="leadSource"
                      list="leadSources"
                      value={formData.leadSource}
                      onChange={(e) =>
                        setFormData({ ...formData, leadSource: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {editingClient ? "Update" : "Save"}
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
                <div className="space-y-3 mt-2 max-h-[200px] overflow-y-auto pr-2">
                  {topNationalities.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="w-24 truncate font-medium">
                          {item.name}
                        </span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-slate-500">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-2">
                  No nationality data yet.
                </p>
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
                <div className="space-y-3 mt-2 max-h-[200px] overflow-y-auto pr-2">
                  {topSources.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="w-24 truncate font-medium">
                          {item.name}
                        </span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-slate-500">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-2">
                  No lead source data yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Card View (Phone / Small Tablet) */}
      <div className="block md:hidden space-y-3">
        {sortedFilteredClients.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
            {searchQuery
              ? "No clients found matching your search."
              : "No clients found. Add one to get started."}
          </div>
        ) : (
          sortedFilteredClients.map((client) => (
            <div
              key={client.id}
              className={`bg-white dark:bg-card rounded-xl border border-slate-200/80 dark:border-border p-4 shadow-sm hover:shadow-md transition-shadow space-y-3 ${
                highlightedId === client.id
                  ? "bg-slate-100 ring-2 ring-slate-400 ring-inset"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-border/60 pb-2.5">
                <div>
                  <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
                    {client.name}
                  </h4>
                  {client.leadSource && (
                    <span className="text-xs text-muted-foreground">
                      Source: {client.leadSource}
                    </span>
                  )}
                </div>
                {client.nationality && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 font-medium shrink-0">
                    {client.nationality}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${client.email}`}
                      className="hover:underline hover:text-primary truncate"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <a
                      href={`tel:${client.phone}`}
                      className="hover:underline hover:text-primary"
                    >
                      {formatPhoneNumber(client.phone)}
                    </a>
                  </div>
                )}
                {client.notes && (
                  <p className="text-xs text-muted-foreground pt-1 line-clamp-2 italic bg-slate-50 dark:bg-muted/30 p-2 rounded">
                    "{client.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(client)}
                  className="h-10 text-xs flex-1 font-medium text-slate-700 dark:text-slate-200"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit Client
                </Button>
                {client.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-10 text-xs px-3 font-medium text-slate-700 dark:text-slate-200"
                  >
                    <a href={`tel:${client.phone}`}>
                      <Phone className="w-3.5 h-3.5 mr-1.5" />
                      Call
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setClientToDelete(client.id)}
                  className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10"
                  title="Delete Client"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop / Tablet Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right sticky right-0 bg-white/95 dark:bg-card/95 backdrop-blur z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] pr-4 min-w-[110px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFilteredClients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchQuery
                      ? "No clients found matching your search."
                      : "No clients found. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                sortedFilteredClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className={`group hover:bg-slate-50/80 transition-colors ${highlightedId === client.id ? "bg-slate-100 ring-2 ring-slate-400 ring-inset transition-all duration-500" : ""}`}
                    >
                      <TableCell className="font-medium max-w-[160px] truncate" title={client.name}>
                        {client.name}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate" title={client.email}>{client.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatPhoneNumber(client.phone)}</TableCell>
                      <TableCell>{client.nationality || "-"}</TableCell>
                      <TableCell>{client.leadSource || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={client.notes}>
                        {client.notes}
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-white dark:bg-card group-hover:bg-slate-50 dark:group-hover:bg-muted/50 transition-colors z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <ActionTooltip content="Edit Client Details">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(client)}
                              className="text-slate-700 hover:text-primary hover:bg-slate-100"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip content="Delete Client Record">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setClientToDelete(client.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </ActionTooltip>
                        </div>
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

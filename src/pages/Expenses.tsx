import React, { useState } from "react";
import { useStore, Expense } from "@/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const EXPENSE_CATEGORIES = [
  "Insurance",
  "Equipment",
  "Software & Subscriptions",
  "Travel & Transport",
  "Marketing & Ads",
  "Office Supplies",
  "Rent & Utilities",
  "Meals & Entertainment",
  "Other"
];

// Tailwind color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  "Insurance": "#3b82f6", // blue-500
  "Equipment": "#8b5cf6", // violet-500
  "Software & Subscriptions": "#ec4899", // pink-500
  "Travel & Transport": "#f59e0b", // amber-500
  "Marketing & Ads": "#10b981", // emerald-500
  "Office Supplies": "#6366f1", // indigo-500
  "Rent & Utilities": "#ef4444", // red-500
  "Meals & Entertainment": "#14b8a6", // teal-500
  "Other": "#94a3b8" // slate-400
};

function groupLabel(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  
  date.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return "Earlier";
}

function formatKES(amount: number) {
  return "KES " + amount.toLocaleString("en-KE");
}

export function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  
  const defaultForm = {
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    vendor: "",
    description: "",
  };
  
  const [formData, setFormData] = useState<any>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleOpenDialog = (item?: Expense) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        amount: item.amount.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData(defaultForm);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    };

    if (editingItem) {
      await updateExpense(editingItem.id, expenseData);
    } else {
      await addExpense({
        ...expenseData,
        id: Math.random().toString(36).substr(2, 9),
      });
    }
    setIsDialogOpen(false);
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      await deleteExpense(itemToDelete);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesQuery =
      searchQuery === "" ||
      e.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const groups: Record<string, Expense[]> = {};
  filtered
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach((e) => {
      const label = groupLabel(e.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(e);
    });

  const categoryTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  
  const pieData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyTotals: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleString('default', { month: 'short' });
    monthlyTotals[monthKey] = 0;
  }

  expenses.forEach((e) => {
    const date = new Date(e.date);
    if (date >= sixMonthsAgo) {
      const monthKey = date.toLocaleString('default', { month: 'short' });
      if (monthlyTotals[monthKey] !== undefined) {
         monthlyTotals[monthKey] += e.amount;
      }
    }
  });

  const barData = Object.entries(monthlyTotals).map(([name, total]) => ({
    name,
    total
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 shadow-sm rounded-md">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">KES {payload[0].value.toLocaleString("en-KE")}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="w-full max-w-[1600px] mx-auto pb-24 text-foreground">
        
        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-1">Expenses Dashboard</p>
          <div className="flex items-baseline gap-3 mb-6 flex-wrap">
            <span className="font-mono text-5xl font-medium tracking-tight">{formatKES(total)}</span>
            <span className="text-sm text-muted-foreground">spent in total</span>
          </div>
        </div>

        {/* Top Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
           {/* Spending by Category */}
           <div className="border border-border rounded-xl p-6 bg-card flex flex-col shadow-sm">
             <h3 className="text-[15px] font-medium text-foreground mb-6">Spending by Category</h3>
             {pieData.length === 0 ? (
               <p className="py-4 text-center text-muted-foreground text-[15px]">No spending data yet.</p>
             ) : (
               <div className="flex flex-col h-full">
                 <div className="h-[220px] w-full mb-6 text-[13px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         cx="50%"
                         cy="50%"
                         innerRadius={65}
                         outerRadius={100}
                         paddingAngle={3}
                         dataKey="value"
                         stroke="none"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS["Other"]} />
                         ))}
                       </Pie>
                       <Tooltip content={<CustomTooltip />} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
                 
                 <div className="space-y-1 mt-auto">
                   {pieData.slice(0, 4).map((entry) => (
                     <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0 last:pb-0" key={entry.name}>
                       <p className="text-sm text-muted-foreground m-0 flex items-center gap-2.5">
                         <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || CATEGORY_COLORS["Other"] }}></span>
                         {entry.name}
                       </p>
                       <p className="text-sm font-mono font-medium m-0">{entry.value.toLocaleString("en-KE")}</p>
                     </div>
                   ))}
                   {pieData.length > 4 && (
                     <div className="flex justify-between items-center py-2.5">
                       <p className="text-sm text-muted-foreground m-0 flex items-center gap-2.5">
                         <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS["Other"] }}></span>
                         Other Categories
                       </p>
                       <p className="text-sm font-mono font-medium m-0">
                         {pieData.slice(4).reduce((sum, item) => sum + item.value, 0).toLocaleString("en-KE")}
                       </p>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>

           {/* 6-Month Trend Chart */}
           <div className="border border-border rounded-xl p-6 bg-card col-span-1 lg:col-span-2 shadow-sm">
             <h3 className="text-[15px] font-medium text-foreground mb-6">6-Month Trend</h3>
             <div className="h-full min-h-[300px] w-full flex items-end text-[13px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={16}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                    <Bar dataKey="total" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* Ledger Section */}
        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
          <div className="flex gap-3 mb-8 flex-wrap border-b border-dashed border-border pb-8">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                className="w-full h-11 pl-10 pr-4 text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                placeholder="Search vendor or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-11 px-4 text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors appearance-auto w-[200px]"
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button 
              className="flex items-center gap-2 bg-primary text-primary-foreground border border-primary px-5 h-11 rounded-xl text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-90"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4" />
              Log expense
            </button>
          </div>

          <div className="mt-8">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-[15px]">No expenses match your search.</div>
            ) : (
              Object.keys(groups).map((label) => (
                <div className="mt-8 first:mt-0" key={label}>
                  <p className="text-[13px] font-medium text-muted-foreground m-0 mb-3 pb-2 border-b border-border">{label}</p>
                  {groups[label].map((e) => (
                    <div className="flex items-center justify-between py-4 border-b border-border hover:bg-muted/50 transition-colors px-2" key={e.id}>
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[e.category] || CATEGORY_COLORS["Other"] }}></div>
                        <div>
                          <p className="m-0 font-medium text-[15px]">{e.vendor}</p>
                          <p className="mt-1 mb-0 text-sm text-muted-foreground">{e.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right">
                          <p className="m-0 font-mono text-[15px] font-medium">{e.amount.toLocaleString("en-KE")}</p>
                          <p className="mt-1 mb-0 text-[13px] text-muted-foreground">{e.category}</p>
                        </div>
                        <div className="flex gap-2 ml-6">
                          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-border transition-all" aria-label="Edit expense" onClick={() => handleOpenDialog(e)}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" aria-label="Delete expense" onClick={() => confirmDelete(e.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between pt-4 mt-8 border-t border-border px-2">
            <p className="m-0 text-[15px] font-medium text-muted-foreground">Total Selected</p>
            <p className="m-0 font-mono text-base font-semibold">{formatKES(total)}</p>
          </div>
        </div>

      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Expense" : "Log Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Vendor / Payee</Label>
              <Input
                placeholder="e.g. Health Insurance Corp, Apple Store"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Details about this expense..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.amount || !formData.vendor || !formData.category}>
              Save Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
      />
    </>
  );
}

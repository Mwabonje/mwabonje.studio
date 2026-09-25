import React, { useState, useMemo } from "react";
import { useStore, Expense } from "@/store";
import { auth } from "@/lib/firebase";
import { isSuperUser } from "@/lib/auth-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Search, Plus, Edit2, Trash2, ShieldCheck, HeartPulse, Bell, CheckCircle2, Clock, Smartphone } from "lucide-react";
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
  "House Rent",
  "Health Insurance",
  "NSSF",
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
  "House Rent": "#f97316", // orange-500
  "Health Insurance": "#0ea5e9", // sky-500
  "NSSF": "#16a34a", // green-600 (NSSF Kenya classic brand green)
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

// Common vendor/payee presets for Kenya and creative/freelance businesses
const COMMON_VENDORS = [
  "House Rent / Landlord",
  "NSSF Kenya",
  "Social Health Authority (SHA) / NHIF",
  "Kenya Revenue Authority (KRA)",
  "Safaricom / M-Pesa",
  "Airtel Kenya",
  "Kenya Power (KPLC)",
  "Nairobi Water / Water Bill",
  "Adobe Creative Cloud",
  "Google Workspace",
  "Apple",
  "Microsoft 365",
  "HostPinnacle / Web Hosting",
  "Uber / Bolt",
  "Camera & Production Store",
  "Office Supplies & Printing"
];

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
  const { expenses, reminders, addExpense, updateExpense, deleteExpense, updateReminder, addReminder } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  
  const defaultForm = {
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    vendor: "",
    description: "",
    mpesaReference: "",
  };
  
  const [formData, setFormData] = useState<any>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isCustomVendor, setIsCustomVendor] = useState(false);
  const [showMpesaInput, setShowMpesaInput] = useState(false);

  // Dynamic vendor list combining presets + all existing vendors from history
  const vendorOptions = useMemo(() => {
    const fromExpenses = expenses.map((e) => e.vendor?.trim()).filter(Boolean);
    return Array.from(new Set([...COMMON_VENDORS, ...fromExpenses]));
  }, [expenses]);

  const handleOpenDialog = (item?: Expense) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        amount: item.amount.toString(),
        mpesaReference: item.mpesaReference || "",
      });
      setIsCustomVendor(Boolean(item.vendor && !vendorOptions.includes(item.vendor)));
      setShowMpesaInput(Boolean(item.mpesaReference));
    } else {
      setEditingItem(null);
      setFormData(defaultForm);
      setIsCustomVendor(false);
      setShowMpesaInput(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      mpesaReference: formData.mpesaReference?.trim() || "",
    };

    if (editingItem) {
      await updateExpense(editingItem.id, expenseData);
    } else {
      await addExpense({
        ...expenseData,
        id: Math.random().toString(36).substr(2, 9),
      });

      // If user logs an NSSF expense, advance the pending NSSF reminder automatically (for super admin)
      if (expenseData.category === "NSSF" && isSuperUser(auth.currentUser?.email)) {
        const pendingNssf = reminders.find(
          (r) => (r.category === "NSSF" || r.title?.toLowerCase().includes("nssf")) && r.status === "pending"
        );
        if (pendingNssf) {
          await updateReminder(pendingNssf.id, { status: "paid" });
          const currentDue = new Date(pendingNssf.dueDate);
          const nextDue = new Date(currentDue);
          nextDue.setMonth(nextDue.getMonth() + 1);
          const nextMonthName = nextDue.toLocaleString("default", { month: "long", year: "numeric" });
          await addReminder({
            ...pendingNssf,
            id: Math.random().toString(36).substr(2, 9),
            title: "NSSF Monthly Contribution",
            description: `${nextMonthName} statutory contribution (KES 500)`,
            dueDate: nextDue.toISOString().split("T")[0],
            status: "pending",
          });
        }
      }
    }
    setIsDialogOpen(false);
  };

  const handlePayNssfMonth = async (monthName: string, dueDateStr: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    await addExpense({
      id: newId,
      date: new Date().toISOString().split("T")[0],
      amount: 500,
      category: "NSSF",
      vendor: "NSSF Kenya",
      description: `${monthName} statutory contribution (Paid)`,
    });

    const pendingNssf = reminders.find(
      (r) => (r.category === "NSSF" || r.title?.toLowerCase().includes("nssf")) && r.status === "pending"
    );
    if (pendingNssf) {
      await updateReminder(pendingNssf.id, { status: "paid" });
      const currentDue = new Date(pendingNssf.dueDate);
      const nextDue = new Date(currentDue);
      nextDue.setMonth(nextDue.getMonth() + 1);
      const nextMonthName = nextDue.toLocaleString("default", { month: "long", year: "numeric" });
      await addReminder({
        ...pendingNssf,
        id: Math.random().toString(36).substr(2, 9),
        title: "NSSF Monthly Contribution",
        description: `${nextMonthName} statutory contribution (KES 500)`,
        dueDate: nextDue.toISOString().split("T")[0],
        status: "pending",
      });
    }
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

  // Statutory contribution tracking calculations
  const nssfExpenses = expenses
    .filter((e) => e.category === "NSSF")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasSeptemberNssf = nssfExpenses.some(
    (e) => e.date.startsWith("2026-09") || e.description?.toLowerCase().includes("september")
  );

  const hasOctoberNssf = nssfExpenses.some(
    (e) => e.date.startsWith("2026-10") || e.description?.toLowerCase().includes("october")
  );

  const nssfReminder = reminders.find(
    (r) => (r.category === "NSSF" || r.title?.toLowerCase().includes("nssf")) && r.status === "pending"
  );

  const healthReminder = reminders.find(
    (r) => (r.category === "Health Insurance" || r.title?.toLowerCase().includes("health insurance")) && r.status === "pending"
  );

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
                  <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={8}
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

        {/* Monthly Statutory & Recurring Contributions Tracker - Super Admin Only */}
        {isSuperUser(auth.currentUser?.email) && (
          <div className="border border-border rounded-xl p-6 bg-card shadow-sm mb-12">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-medium text-foreground">Monthly Statutory & Insurance Tracker</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated tracking and payment reminders for statutory deductions and recurring health coverage.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium text-muted-foreground border border-border">
                Auto-Reminder Active
              </span>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NSSF Card */}
            <div className="p-4 rounded-xl border border-border bg-background/50 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      NSSF Contribution
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        KES 500 / month
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">National Social Security Fund (Kenya)</p>
                  </div>
                </div>
              </div>

              {/* Monthly breakdown status */}
              <div className="mt-4 space-y-2 pt-3 border-t border-border/60">
                {/* September status */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    {hasSeptemberNssf ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    September 2026:
                  </span>
                  {hasSeptemberNssf ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      ✓ Paid (KES 500)
                    </span>
                  ) : (
                    <span className="font-medium text-amber-500">
                      Unpaid
                    </span>
                  )}
                </div>

                {/* October status */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    {hasOctoberNssf ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    October 2026:
                  </span>
                  {hasOctoberNssf ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Paid (KES 500)
                    </span>
                  ) : (
                    <span className="font-medium text-amber-500">
                      Due Oct 9, 2026 (Pending)
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
                {!hasOctoberNssf && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                    onClick={() => handlePayNssfMonth("October 2026", "2026-10-09")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Mark Oct Paid
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const nssfRem = reminders.find(
                      (r) => r.category === "NSSF" || r.title?.toLowerCase().includes("nssf")
                    );
                    window.dispatchEvent(
                      new CustomEvent("preview-reminder", { detail: { reminderId: nssfRem?.id } })
                    );
                  }}
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Test Reminder Alert
                </Button>
              </div>
            </div>

            {/* Health Insurance Card */}
            <div className="p-4 rounded-xl border border-border bg-background/50 hover:border-sky-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Health Insurance (SHA)
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        KES 1,188 / month
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">Social Health Authority / NHIF</p>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="mt-4 space-y-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Coverage Status:
                  </span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">
                    Paid 4 months in advance
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Next Renewal Date:
                  </span>
                  <span className="font-medium text-foreground">
                    February 10, 2027
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const healthRem = reminders.find(
                      (r) => r.category === "Health Insurance" || r.title?.toLowerCase().includes("health insurance")
                    );
                    window.dispatchEvent(
                      new CustomEvent("preview-reminder", { detail: { reminderId: healthRem?.id } })
                    );
                  }}
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Preview Reminder
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Ledger Section */}
        <div className="border border-border rounded-xl p-4 sm:p-6 bg-card shadow-sm">
          <div className="flex gap-3 mb-6 sm:mb-8 flex-col sm:flex-row flex-wrap border-b border-dashed border-border pb-6 sm:pb-8">
            <div className="relative flex-1 min-w-[200px]">
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
              className="h-11 px-4 text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors appearance-auto w-full sm:w-[200px]"
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button 
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground border border-primary px-5 h-11 rounded-xl text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-90 w-full sm:w-auto"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4" />
              Log expense
            </button>
          </div>

          <div className="mt-6 sm:mt-8">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-[15px]">No expenses match your search.</div>
            ) : (
              Object.keys(groups).map((label) => (
                <div className="mt-8 first:mt-0" key={label}>
                  <p className="text-[13px] font-medium text-muted-foreground m-0 mb-3 pb-2 border-b border-border">{label}</p>
                  {groups[label].map((e) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-3.5 sm:py-4 border-b border-border hover:bg-muted/50 transition-colors px-2 rounded-lg" key={e.id}>
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0" style={{ backgroundColor: CATEGORY_COLORS[e.category] || CATEGORY_COLORS["Other"] }}></div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="m-0 font-medium text-sm sm:text-[15px]">{e.vendor}</p>
                            {e.mpesaReference && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                M-Pesa: {e.mpesaReference}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 sm:mt-1 mb-0 text-xs sm:text-sm text-muted-foreground">{e.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 ml-5 sm:ml-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
                        <div className="text-left sm:text-right">
                          <p className="m-0 font-mono text-sm sm:text-[15px] font-semibold">{e.amount.toLocaleString("en-KE")}</p>
                          <p className="mt-0.5 mb-0 text-xs text-muted-foreground">{e.category}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <ActionTooltip content="Edit Expense Details">
                            <button className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all" aria-label="Edit expense" onClick={() => handleOpenDialog(e)}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip content="Delete Expense Record">
                            <button className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" aria-label="Delete expense" onClick={() => confirmDelete(e.id)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </ActionTooltip>
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
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingItem ? "Edit Expense" : "Log Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vendor / Payee</Label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isCustomVendor;
                    setIsCustomVendor(next);
                    if (!next && !vendorOptions.includes(formData.vendor)) {
                      setFormData({ ...formData, vendor: "" });
                    }
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {isCustomVendor ? "Choose from list" : "+ Type custom vendor"}
                </button>
              </div>

              {!isCustomVendor ? (
                <Select
                  value={formData.vendor}
                  onValueChange={(val) => {
                    if (val === "__custom__") {
                      setIsCustomVendor(true);
                      setFormData({ ...formData, vendor: "" });
                      return;
                    }

                    // Smart auto-fill for category & recurring amounts
                    let autoCategory = formData.category;
                    let autoAmount = formData.amount;
                    if (val.includes("House Rent") || val.toLowerCase().includes("rent")) {
                      if (!autoCategory) autoCategory = "House Rent";
                      setShowMpesaInput(true);
                    } else if (val === "NSSF Kenya") {
                      if (!autoCategory) autoCategory = "NSSF";
                      if (!autoAmount) autoAmount = "500";
                    } else if (val.includes("Social Health Authority") || val.includes("SHA")) {
                      if (!autoCategory) autoCategory = "Health Insurance";
                      if (!autoAmount) autoAmount = "1188";
                    } else if (val === "Kenya Revenue Authority (KRA)") {
                      if (!autoCategory) autoCategory = "Other";
                    } else if (val.includes("Safaricom") || val.includes("Airtel") || val.includes("Kenya Power") || val.includes("Water")) {
                      if (!autoCategory) autoCategory = "Rent & Utilities";
                    } else if (val.includes("Adobe") || val.includes("Google") || val.includes("Microsoft") || val.includes("Hosting")) {
                      if (!autoCategory) autoCategory = "Software & Subscriptions";
                    } else if (val.includes("Uber") || val.includes("Bolt")) {
                      if (!autoCategory) autoCategory = "Travel & Transport";
                    } else if (val.includes("Camera") || val.includes("Production")) {
                      if (!autoCategory) autoCategory = "Equipment";
                    } else if (val.includes("Office Supplies")) {
                      if (!autoCategory) autoCategory = "Office Supplies";
                    }

                    setFormData({
                      ...formData,
                      vendor: val,
                      category: autoCategory,
                      amount: autoAmount,
                    });
                  }}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select vendor / payee" />
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[340px] max-h-[280px]">
                    {vendorOptions.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-primary font-medium">
                      + Enter other vendor...
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Type vendor or payee name..."
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="h-10"
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => {
                  setFormData({ ...formData, category: val });
                  if (val === "House Rent" || val.toLowerCase().includes("rent")) {
                    setShowMpesaInput(true);
                  }
                }}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[280px] max-h-[280px]">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* M-Pesa Transaction Reference Input (Auto-shown when House Rent is selected) */}
            {(formData.category === "House Rent" ||
              formData.vendor?.toLowerCase().includes("rent") ||
              showMpesaInput ||
              Boolean(formData.mpesaReference)) ? (
              <div className="space-y-2.5 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 transition-all">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Label className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>M-Pesa Reference / Transaction Code</span>
                  </Label>
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                    Payment Receipt
                  </span>
                </div>
                <Input
                  placeholder="e.g. QK89XY452Z"
                  value={formData.mpesaReference || ""}
                  onChange={(e) => setFormData({ ...formData, mpesaReference: e.target.value.toUpperCase().trim() })}
                  className="bg-background border-emerald-500/30 focus-visible:ring-emerald-500 font-mono tracking-widest text-sm font-semibold uppercase placeholder:font-normal placeholder:tracking-normal placeholder:capitalize h-11"
                  autoFocus={formData.category === "House Rent" && !formData.mpesaReference}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the Safaricom M-Pesa confirmation code as proof of your rent transfer.
                </p>
              </div>
            ) : (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowMpesaInput(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  + Add M-Pesa transaction reference
                </button>
              </div>
            )}

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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="px-5 h-10" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="px-6 h-10" onClick={handleSave} disabled={!formData.amount || !formData.vendor || !formData.category}>
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

import React, { useState, useMemo } from "react";
import { useStore, SchoolDeposit, SchoolDepositMethod, SchoolDepositPurpose } from "@/store";
import { auth } from "@/lib/firebase";
import { isSuperUser } from "@/lib/auth-utils";
import { Navigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ActionTooltip } from "@/components/ui/tooltip";
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  Clock, 
  Smartphone, 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Edit2, 
  Trash2, 
  Search, 
  PiggyBank, 
  Receipt, 
  CheckCircle2, 
  Coins,
  Settings2,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

const METHOD_LABELS: Record<SchoolDepositMethod, string> = {
  mpesa: "M-Pesa",
  bank_transfer: "Bank Transfer",
  standing_order: "Standing Order",
  cash: "Cash Deposit",
  cheque: "Cheque",
  other: "Other Method",
};

const PURPOSE_LABELS: Record<SchoolDepositPurpose, string> = {
  tuition: "Tuition Fees",
  admission: "Admission & Registration",
  uniform_books: "Uniform & Books",
  transport_meals: "Transport & Meals",
  general_savings: "General School Fund",
  other: "Other Expense",
};

const COMMON_TERMS = [
  "Term 1 2027",
  "Term 2 2027",
  "Term 3 2027",
  "Term 1 2028",
  "Term 2 2028",
  "Term 3 2028",
  "Annual School Fund",
  "High School Trust Fund",
  "General Savings",
];

export function SchoolSavings() {
  const currentUser = auth.currentUser;
  const isSuper = isSuperUser(currentUser?.email);

  // Strictly gate access for Super Admin only
  if (!isSuper) {
    return <Navigate to="/dashboard" replace />;
  }

  const { 
    schoolDeposits, 
    schoolAccountMeta, 
    addSchoolDeposit, 
    updateSchoolDeposit, 
    deleteSchoolDeposit,
    updateSchoolAccountMeta 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<SchoolDeposit | null>(null);

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<string | null>(null);

  // Form states for deposit
  const defaultDepositForm = {
    date: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "mpesa" as SchoolDepositMethod,
    mpesaReference: "",
    targetTerm: "Term 1 2027",
    purpose: "tuition" as SchoolDepositPurpose,
    bankName: schoolAccountMeta?.bankName || "",
    accountNumber: schoolAccountMeta?.accountNumber || "",
    depositedBy: "Michael (Dad)",
    receiptNumber: "",
    notes: "",
  };

  const [depositForm, setDepositForm] = useState<any>(defaultDepositForm);

  // Form state for account details & target goal
  const [accountForm, setAccountForm] = useState({
    accountName: schoolAccountMeta?.accountName || "Son's School Fees Account",
    sonName: schoolAccountMeta?.sonName || "Son",
    bankName: schoolAccountMeta?.bankName || "School Fees Savings Account",
    accountNumber: schoolAccountMeta?.accountNumber || "",
    paybillOrTill: schoolAccountMeta?.paybillOrTill || "",
    targetGoal: (schoolAccountMeta?.targetGoal || 150000).toString(),
    targetDate: schoolAccountMeta?.targetDate || "2027-01-10",
    notes: schoolAccountMeta?.notes || "",
  });

  // Calculate metrics
  const totalSaved = useMemo(() => {
    return schoolDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [schoolDeposits]);

  const targetGoal = Number(schoolAccountMeta?.targetGoal) || 150000;
  const progressPercent = Math.min(100, Math.round((totalSaved / targetGoal) * 100));
  const remainingGoal = Math.max(0, targetGoal - totalSaved);

  // Current month's deposits
  const currentMonthSaved = useMemo(() => {
    const now = new Date();
    const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return schoolDeposits
      .filter((d) => (d.date || "").startsWith(currentPrefix))
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [schoolDeposits]);

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return schoolDeposits.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        d.targetTerm.toLowerCase().includes(q) ||
        (d.mpesaReference && d.mpesaReference.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q)) ||
        (d.bankName && d.bankName.toLowerCase().includes(q)) ||
        PURPOSE_LABELS[d.purpose]?.toLowerCase().includes(q);

      const matchesTerm = termFilter === "all" || d.targetTerm === termFilter;
      const matchesMethod = methodFilter === "all" || d.paymentMethod === methodFilter;

      return matchesSearch && matchesTerm && matchesMethod;
    });
  }, [schoolDeposits, searchQuery, termFilter, methodFilter]);

  const handleOpenDepositDialog = (deposit?: SchoolDeposit) => {
    if (deposit) {
      setEditingDeposit(deposit);
      setDepositForm({
        ...deposit,
        amount: deposit.amount.toString(),
      });
    } else {
      setEditingDeposit(null);
      setDepositForm({
        ...defaultDepositForm,
        bankName: schoolAccountMeta?.bankName || "",
        accountNumber: schoolAccountMeta?.accountNumber || "",
      });
    }
    setIsDepositDialogOpen(true);
  };

  const handleSaveDeposit = async () => {
    const amountVal = parseFloat(depositForm.amount);
    if (!amountVal || amountVal <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }

    const depositData: SchoolDeposit = {
      id: editingDeposit ? editingDeposit.id : Math.random().toString(36).substr(2, 9),
      date: depositForm.date || new Date().toISOString().split("T")[0],
      amount: amountVal,
      paymentMethod: depositForm.paymentMethod,
      mpesaReference: depositForm.mpesaReference?.toUpperCase().trim() || "",
      targetTerm: depositForm.targetTerm || "Term 1 2027",
      purpose: depositForm.purpose || "tuition",
      notes: depositForm.notes?.trim() || "",
      bankName: depositForm.bankName?.trim() || "",
      accountNumber: depositForm.accountNumber?.trim() || "",
      depositedBy: depositForm.depositedBy?.trim() || "Michael (Dad)",
      receiptNumber: depositForm.receiptNumber?.trim() || "",
      createdAt: editingDeposit?.createdAt || new Date().toISOString(),
    };

    if (editingDeposit) {
      await updateSchoolDeposit(editingDeposit.id, depositData);
      toast.success("Deposit record updated successfully");
    } else {
      await addSchoolDeposit(depositData);
      toast.success(`KES ${amountVal.toLocaleString()} deposit recorded for your son's school fund!`);
    }

    setIsDepositDialogOpen(false);
  };

  const handleSaveAccountMeta = async () => {
    const goalVal = parseFloat(accountForm.targetGoal) || 150000;
    await updateSchoolAccountMeta({
      accountName: accountForm.accountName,
      sonName: accountForm.sonName,
      bankName: accountForm.bankName,
      accountNumber: accountForm.accountNumber,
      paybillOrTill: accountForm.paybillOrTill,
      targetGoal: goalVal,
      targetDate: accountForm.targetDate,
      notes: accountForm.notes,
    });
    toast.success("School fees account details updated");
    setIsAccountDialogOpen(false);
  };

  const confirmDelete = (id: string) => {
    setDepositToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (depositToDelete) {
      await deleteSchoolDeposit(depositToDelete);
      toast.success("Deposit record deleted");
      setDeleteConfirmOpen(false);
      setDepositToDelete(null);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-24 text-foreground">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Super Admin Private Fund
            </span>
            <span className="text-muted-foreground">• Confidential</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span>Son's School Fees Savings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and build your son's dedicated school deposits, target academic terms, and savings growth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAccountForm({
                accountName: schoolAccountMeta?.accountName || "Son's School Fees Account",
                sonName: schoolAccountMeta?.sonName || "Son",
                bankName: schoolAccountMeta?.bankName || "School Fees Savings Account",
                accountNumber: schoolAccountMeta?.accountNumber || "",
                paybillOrTill: schoolAccountMeta?.paybillOrTill || "",
                targetGoal: (schoolAccountMeta?.targetGoal || 150000).toString(),
                targetDate: schoolAccountMeta?.targetDate || "2027-01-10",
                notes: schoolAccountMeta?.notes || "",
              });
              setIsAccountDialogOpen(true);
            }}
            className="h-10 text-xs sm:text-sm font-medium"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Account & Target Settings
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenDepositDialog()}
            className="h-10 text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log New Deposit
          </Button>
        </div>
      </div>

      {/* Account Info & Target Goal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Account Profile */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-primary" />
                Savings Account Profile
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active Account
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground">
              {schoolAccountMeta?.accountName || "Son's School Fees Account"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Beneficiary: <strong className="text-foreground">{schoolAccountMeta?.sonName || "Son"}</strong>
            </p>

            <div className="mt-4 pt-4 border-t border-border/60 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Institution / Bank:
                </span>
                <span className="font-medium text-foreground">
                  {schoolAccountMeta?.bankName || "Savings Account"}
                </span>
              </div>

              {schoolAccountMeta?.accountNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                    Account Number:
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {schoolAccountMeta.accountNumber}
                  </span>
                </div>
              )}

              {schoolAccountMeta?.paybillOrTill && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    M-Pesa Paybill / Till:
                  </span>
                  <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                    {schoolAccountMeta.paybillOrTill}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
            <span>Opened & Managed By:</span>
            <span className="font-medium text-foreground">Michael (Super Admin)</span>
          </div>
        </div>

        {/* Card 2: Savings Goal Progress */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                Target Savings Progress
              </span>
              <span className="text-xs font-bold text-primary">
                {progressPercent}% Achieved
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-3 flex-wrap">
              <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                KES {totalSaved.toLocaleString("en-KE")}
              </span>
              <span className="text-sm text-muted-foreground">
                of KES {targetGoal.toLocaleString("en-KE")} Target Goal
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3 border border-border/60">
              <div 
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border/60 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Remaining Balance</p>
                <p className="font-mono text-sm font-semibold text-foreground">
                  KES {remainingGoal.toLocaleString("en-KE")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">This Month's Deposits</p>
                <p className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  +KES {currentMonthSaved.toLocaleString("en-KE")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Target Academic Term</p>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {schoolAccountMeta?.targetDate ? `Due ${schoolAccountMeta.targetDate}` : "Term 1 2027"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Keep building steady deposits each month to cover school term fees with peace of mind.
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Section */}
      <div className="border border-border rounded-2xl p-4 sm:p-6 bg-card shadow-sm">
        <div className="flex gap-3 mb-6 flex-col sm:flex-row flex-wrap border-b border-dashed border-border pb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              className="w-full h-11 pl-10 pr-4 text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
              placeholder="Search reference, notes, or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="h-11 px-4 text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors appearance-auto w-full sm:w-[180px]"
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
          >
            <option value="all">All Terms / Funds</option>
            {COMMON_TERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="h-11 px-4 text-sm bg-transparent border border-border rounded-xl focus:outline-none focus:border-foreground transition-colors appearance-auto w-full sm:w-[180px]"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="standing_order">Standing Order</option>
            <option value="cash">Cash Deposit</option>
            <option value="cheque">Cheque</option>
          </select>

          <Button
            onClick={() => handleOpenDepositDialog()}
            className="h-11 px-5 rounded-xl font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Deposit
          </Button>
        </div>

        {/* Ledger Table */}
        <div className="mt-4">
          {filteredDeposits.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-foreground text-base">No school deposits logged yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Record your first deposit into your son's school savings account to begin tracking your educational fund growth.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDepositDialog()}
                className="mt-4 rounded-full"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Record First Deposit
              </Button>
            </div>
          ) : (
            <>
              {/* Table Column Headers */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border mb-3 bg-muted/40 rounded-lg">
                <div className="col-span-3">Term & Purpose</div>
                <div className="col-span-2">Deposit Date</div>
                <div className="col-span-2">Method & Ref</div>
                <div className="col-span-2">Deposited By</div>
                <div className="col-span-2 text-right">Amount (KES)</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="space-y-1">
                {filteredDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="py-3.5 px-3 border-b border-border/60 hover:bg-muted/40 transition-colors rounded-lg md:grid md:grid-cols-12 md:gap-4 md:items-center"
                  >
                    {/* Col 1: Term & Purpose */}
                    <div className="md:col-span-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-[15px] text-foreground">
                          {dep.targetTerm}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {PURPOSE_LABELS[dep.purpose] || dep.purpose}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {dep.notes || "No additional notes"}
                      </p>
                    </div>

                    {/* Col 2: Date */}
                    <div className="hidden md:flex md:col-span-2 items-center gap-1.5 text-sm text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium whitespace-nowrap">
                        {dep.date ? new Date(dep.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </div>

                    {/* Col 3: Method & Ref */}
                    <div className="hidden md:flex md:col-span-2 items-center gap-1.5 min-w-0">
                      {dep.paymentMethod === "mpesa" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 truncate max-w-full">
                          <Smartphone className="w-3 h-3 shrink-0" />
                          <span>{dep.mpesaReference || "M-Pesa"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/80 truncate max-w-full">
                          <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{METHOD_LABELS[dep.paymentMethod] || "Bank"}</span>
                        </span>
                      )}
                    </div>

                    {/* Col 4: Deposited By */}
                    <div className="hidden md:block md:col-span-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{dep.depositedBy || "Michael"}</p>
                      {dep.bankName && <p className="text-[11px] text-muted-foreground truncate">{dep.bankName}</p>}
                    </div>

                    {/* Col 5: Amount */}
                    <div className="hidden md:block md:col-span-2 text-right">
                      <p className="m-0 font-mono text-sm sm:text-[15px] font-bold text-foreground">
                        KES {dep.amount.toLocaleString("en-KE")}
                      </p>
                    </div>

                    {/* Col 6: Actions */}
                    <div className="hidden md:flex md:col-span-1 justify-end gap-1">
                      <ActionTooltip content="Edit Deposit Record">
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          onClick={() => handleOpenDepositDialog(dep)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip content="Delete Record">
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => confirmDelete(dep.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ActionTooltip>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden mt-2 pt-2 border-t border-border/40 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{dep.date ? new Date(dep.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                        </span>
                        {dep.mpesaReference && (
                          <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Ref: {dep.mpesaReference}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-sm font-bold text-foreground">
                          KES {dep.amount.toLocaleString("en-KE")}
                        </span>
                        <div className="flex gap-1">
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleOpenDepositDialog(dep)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => confirmDelete(dep.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Footer */}
              <div className="flex justify-between pt-4 mt-6 border-t border-border px-2">
                <p className="m-0 text-sm font-medium text-muted-foreground">
                  Total Logged Deposits ({filteredDeposits.length})
                </p>
                <p className="m-0 font-mono text-base font-bold text-primary">
                  KES {filteredDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toLocaleString("en-KE")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Log / Edit Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>{editingDeposit ? "Edit School Deposit" : "Log School Fees Deposit"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Deposit Date
                </Label>
                <Input
                  type="date"
                  value={depositForm.date}
                  onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-primary" />
                  Deposit Amount (KES)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 10000"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="h-10 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Term / Fund</Label>
                <Select
                  value={depositForm.targetTerm}
                  onValueChange={(val) => setDepositForm({ ...depositForm, targetTerm: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select target term" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px]">
                    {COMMON_TERMS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Allocation Purpose</Label>
                <Select
                  value={depositForm.purpose}
                  onValueChange={(val: any) => setDepositForm({ ...depositForm, purpose: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PURPOSE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deposit Method</Label>
                <Select
                  value={depositForm.paymentMethod}
                  onValueChange={(val: any) => setDepositForm({ ...depositForm, paymentMethod: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHOD_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  M-Pesa Reference / Transaction Code
                </Label>
                <Input
                  placeholder="e.g. UK1CQ0V8VW"
                  value={depositForm.mpesaReference}
                  onChange={(e) => setDepositForm({ ...depositForm, mpesaReference: e.target.value.toUpperCase().trim() })}
                  className="h-10 font-mono tracking-wider uppercase font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution / Bank Name</Label>
                <Input
                  placeholder="e.g. Equity Bank / Co-operative Bank"
                  value={depositForm.bankName}
                  onChange={(e) => setDepositForm({ ...depositForm, bankName: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Deposited By</Label>
                <Input
                  placeholder="e.g. Michael (Dad)"
                  value={depositForm.depositedBy}
                  onChange={(e) => setDepositForm({ ...depositForm, depositedBy: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes & Description (Optional)</Label>
              <Textarea
                placeholder="Details about this deposit, receipt notes, or future school term goals..."
                value={depositForm.notes}
                onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDeposit} disabled={!depositForm.amount || parseFloat(depositForm.amount) <= 0}>
              {editingDeposit ? "Update Deposit" : "Save Deposit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Settings Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <span>School Fees Account & Target Goal</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs sm:text-sm">
            <div className="space-y-2">
              <Label>Account Title</Label>
              <Input
                value={accountForm.accountName}
                onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                placeholder="e.g. Son's School Fees Account"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Beneficiary (Son's Name)</Label>
                <Input
                  value={accountForm.sonName}
                  onChange={(e) => setAccountForm({ ...accountForm, sonName: e.target.value })}
                  placeholder="e.g. Son"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Target Savings Goal (KES)</Label>
                <Input
                  type="number"
                  value={accountForm.targetGoal}
                  onChange={(e) => setAccountForm({ ...accountForm, targetGoal: e.target.value })}
                  placeholder="150000"
                  className="h-10 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank / Savings Provider</Label>
                <Input
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                  placeholder="e.g. Equity Bank"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  placeholder="e.g. 0123456789"
                  className="h-10 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>M-Pesa Paybill / Till (Optional)</Label>
              <Input
                value={accountForm.paybillOrTill}
                onChange={(e) => setAccountForm({ ...accountForm, paybillOrTill: e.target.value })}
                placeholder="e.g. Paybill 247247"
                className="h-10 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Due Date</Label>
              <Input
                type="date"
                value={accountForm.targetDate}
                onChange={(e) => setAccountForm({ ...accountForm, targetDate: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccountMeta}>
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Delete School Deposit Record"
        description="Are you sure you want to remove this deposit record? This action cannot be undone."
      />
    </div>
  );
}

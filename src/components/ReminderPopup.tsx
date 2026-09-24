import React, { useEffect, useState } from 'react';
import { useStore, Reminder } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export function ReminderPopup() {
  const { reminders, expenses, updateReminder, addExpense, addReminder } = useStore();
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const due = reminders.filter(r => {
        if (r.status !== 'pending') return false;

        // Check if snoozed in this browser session
        try {
          const snoozedAt = sessionStorage.getItem(`snoozed_reminder_${r.id}`);
          if (snoozedAt && Date.now() - Number(snoozedAt) < 4 * 60 * 60 * 1000) {
            return false;
          }
        } catch (e) {}
        
        const dueDate = new Date(r.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Show if overdue or due within 7 days, or if current month has arrived for this due date
        const isCurrentOrPastMonth = 
          today.getFullYear() > dueDate.getFullYear() ||
          (today.getFullYear() === dueDate.getFullYear() && today.getMonth() >= dueDate.getMonth());

        return diffDays <= 7 || isCurrentOrPastMonth;
      });

      // Sort by due date (earliest due first)
      due.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setActiveReminders(due);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 30);

    // Listen for manual preview/test triggers from Expenses dashboard
    const handlePreview = (e: any) => {
      const reminderId = e.detail?.reminderId;
      const target = reminders.find(r => r.id === reminderId) || reminders[0];
      if (target) {
        setActiveReminders([target]);
        setCurrentIndex(0);
      }
    };

    window.addEventListener('preview-reminder', handlePreview);

    return () => {
      clearInterval(interval);
      window.removeEventListener('preview-reminder', handlePreview);
    };
  }, [reminders]);

  const handleMarkPaid = async (reminder: Reminder) => {
    // 1. Mark current reminder as paid
    await updateReminder(reminder.id, { status: 'paid' });

    // 2. Log it as an expense automatically
    if (reminder.amount && reminder.category) {
      const dueDateObj = new Date(reminder.dueDate);
      const monthName = dueDateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      const vendorName = reminder.category === 'NSSF' ? 'NSSF Kenya' : (reminder.title || 'Statutory Payment');

      await addExpense({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        amount: reminder.amount,
        category: reminder.category,
        vendor: vendorName,
        description: reminder.description || `${reminder.title} - ${monthName} (Paid)`,
      });
    }

    // 3. Reschedule if recurring
    if (reminder.isRecurring && reminder.recurringInterval === 'monthly') {
      const currentDue = new Date(reminder.dueDate);
      const nextDue = new Date(currentDue);
      nextDue.setMonth(nextDue.getMonth() + 1);
      const nextMonthName = nextDue.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      await addReminder({
        ...reminder,
        id: Math.random().toString(36).substr(2, 9),
        title: reminder.title,
        description: reminder.category === 'NSSF'
          ? `${nextMonthName} statutory contribution (KES ${reminder.amount})`
          : reminder.description,
        dueDate: nextDue.toISOString().split('T')[0],
        status: 'pending'
      });
    }

    // Move to next reminder or close
    if (currentIndex < activeReminders.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setActiveReminders([]);
      setCurrentIndex(0);
    }
  };

  const handleDismiss = (reminder: Reminder) => {
    // Snooze for session so user isn't disrupted on every click, but reminder remains pending
    try {
      sessionStorage.setItem(`snoozed_reminder_${reminder.id}`, String(Date.now()));
    } catch (e) {}

    if (currentIndex < activeReminders.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setActiveReminders([]);
      setCurrentIndex(0);
    }
  };

  if (activeReminders.length === 0) return null;

  const currentReminder = activeReminders[currentIndex];
  
  const dueDate = new Date(currentReminder.dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let urgencyText = "";
  let urgencyColor = "text-muted-foreground";
  if (diffDays < 0) {
    urgencyText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    urgencyColor = "text-destructive font-semibold";
  } else if (diffDays === 0) {
    urgencyText = "Due Today";
    urgencyColor = "text-amber-500 font-semibold";
  } else {
    urgencyText = `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    urgencyColor = diffDays <= 3 ? "text-amber-500 font-medium" : "text-muted-foreground";
  }

  const isNssf = currentReminder.category === 'NSSF';

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className={`mx-auto w-12 h-12 ${isNssf ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center mb-3`}>
            {isNssf ? <ShieldCheck className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
          </div>
          <DialogTitle className="text-center text-xl">
            {diffDays < 0 ? "Payment Overdue" : "Contribution Reminder"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeReminders.length > 1 ? `(${currentIndex + 1} of ${activeReminders.length}) ` : ""}
            {currentReminder.category === 'NSSF' 
              ? "Monthly statutory NSSF contribution requires payment."
              : "You have a scheduled payment due."}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-5 my-3 border border-border">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{currentReminder.title}</h3>
                {isNssf && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Statutory
                  </span>
                )}
              </div>
              {currentReminder.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{currentReminder.description}</p>
              )}
            </div>
            {currentReminder.amount && (
              <div className="text-right shrink-0">
                <span className="font-mono text-lg font-bold">
                  KES {currentReminder.amount.toLocaleString("en-KE")}
                </span>
                {currentReminder.isRecurring && (
                  <p className="text-xs text-muted-foreground capitalize">/{currentReminder.recurringInterval}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <Calendar className={`w-4 h-4 ${urgencyColor}`} />
            <span className={`text-sm ${urgencyColor}`}>
              {urgencyText} ({dueDate.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })})
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleDismiss(currentReminder)} className="w-full sm:w-auto">
            <XCircle className="w-4 h-4 mr-2" />
            Remind Later
          </Button>
          <Button 
            onClick={() => handleMarkPaid(currentReminder)} 
            className={`w-full sm:w-auto ${isNssf ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


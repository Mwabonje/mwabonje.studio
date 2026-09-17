import React, { useEffect, useState } from 'react';
import { useStore, Reminder } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { seedHealthInsuranceReminder } from '@/lib/seedReminders';

export function ReminderPopup() {
  const { reminders, updateReminder, addExpense, addReminder } = useStore();
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Check on mount if we should seed the user's specific request
  useEffect(() => {
    // Only seed if no reminders exist to avoid duplicate seeding
    if (reminders.length === 0) {
      seedHealthInsuranceReminder().catch(console.error);
    }
  }, [reminders.length]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const due = reminders.filter(r => {
        if (r.status !== 'pending') return false;
        
        const dueDate = new Date(r.dueDate);
        // Calculate difference in days
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Show if overdue or due within 7 days
        return true; // Force show all pending reminders for demonstration
      });

      // Sort by due date
      due.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setActiveReminders(due);
    };

    checkReminders();
    // Re-check every hour just in case
    const interval = setInterval(checkReminders, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [reminders]);

  const handleMarkPaid = async (reminder: Reminder) => {
    // 1. Mark current reminder as paid
    await updateReminder(reminder.id, { status: 'paid' });

    // 2. Log it as an expense automatically
    if (reminder.amount && reminder.category) {
      await addExpense({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        amount: reminder.amount,
        category: reminder.category,
        vendor: reminder.title,
        description: reminder.description,
      });
    }

    // 3. Reschedule if recurring
    if (reminder.isRecurring && reminder.recurringInterval === 'monthly') {
      const currentDue = new Date(reminder.dueDate);
      const nextDue = new Date(currentDue);
      nextDue.setMonth(nextDue.getMonth() + 1);
      
      await addReminder({
        ...reminder,
        id: Math.random().toString(36).substr(2, 9),
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

  const handleDismiss = async (reminder: Reminder) => {
    await updateReminder(reminder.id, { status: 'dismissed' });
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
    urgencyColor = "text-destructive";
  } else if (diffDays === 0) {
    urgencyText = "Due Today";
    urgencyColor = "text-amber-500";
  } else {
    urgencyText = `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Bell className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-xl">Upcoming Reminder</DialogTitle>
          <DialogDescription className="text-center">
            {activeReminders.length > 1 ? `(${currentIndex + 1} of ${activeReminders.length})` : ""} You have a payment coming up.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-6 my-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">{currentReminder.title}</h3>
              {currentReminder.description && (
                <p className="text-sm text-muted-foreground">{currentReminder.description}</p>
              )}
            </div>
            {currentReminder.amount && (
              <div className="text-right">
                <span className="font-mono text-lg font-bold">
                  KES {currentReminder.amount.toLocaleString("en-KE")}
                </span>
                {currentReminder.isRecurring && (
                  <p className="text-xs text-muted-foreground capitalize">/{currentReminder.recurringInterval}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Calendar className={`w-4 h-4 ${urgencyColor}`} />
            <span className={`text-sm font-medium ${urgencyColor}`}>
              {urgencyText} ({dueDate.toLocaleDateString()})
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleDismiss(currentReminder)} className="w-full sm:w-auto">
            <XCircle className="w-4 h-4 mr-2" />
            Remind Later
          </Button>
          <Button onClick={() => handleMarkPaid(currentReminder)} className="w-full sm:w-auto">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

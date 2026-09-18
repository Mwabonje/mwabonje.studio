import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Reminder, Expense } from '../store';

export const seedHealthInsuranceReminder = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const reminderId = "health-insurance-reminder-1";
  
  // Set the first reminder to Feb 10, 2027
  await setDoc(doc(db, `users/${uid}/reminders`, reminderId), {
    id: reminderId,
    title: "Health Insurance Payment",
    description: "Monthly health insurance premium (SHA)",
    dueDate: "2027-02-10",
    amount: 1188,
    category: "Health Insurance",
    isRecurring: true,
    recurringInterval: 'monthly',
    status: 'pending',
    uid
  });
  console.log("Seeded health insurance reminder");
};

export const seedStatutoryReminders = async (expenses: Expense[], reminders: Reminder[]) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // 1. Seed Health Insurance reminder if not present
  const hasHealthReminder = reminders.some(
    (r) => r.category === "Health Insurance" || r.title?.toLowerCase().includes("health insurance")
  );
  if (!hasHealthReminder) {
    await seedHealthInsuranceReminder();
  }

  // 2. Ensure September 2026 NSSF contribution is recorded as an expense (since user already paid it)
  const hasSeptNssfExpense = expenses.some(
    (e) => e.category === "NSSF" && (e.date.startsWith("2026-09") || e.description?.toLowerCase().includes("september"))
  );
  if (!hasSeptNssfExpense) {
    const septExpenseId = "nssf-exp-sept-2026";
    await setDoc(doc(db, `users/${uid}/expenses`, septExpenseId), {
      id: septExpenseId,
      date: "2026-09-10",
      amount: 500,
      category: "NSSF",
      vendor: "NSSF Kenya",
      description: "September 2026 contribution (Paid)",
      uid
    });
    console.log("Seeded September 2026 NSSF expense");
  }

  // 3. Ensure NSSF monthly recurring reminder is scheduled starting with October 2026
  const hasNssfReminder = reminders.some(
    (r) => r.category === "NSSF" || r.title?.toLowerCase().includes("nssf")
  );
  if (!hasNssfReminder) {
    const nssfReminderId = "nssf-monthly-reminder-1";
    await setDoc(doc(db, `users/${uid}/reminders`, nssfReminderId), {
      id: nssfReminderId,
      title: "NSSF Monthly Contribution",
      description: "October 2026 statutory contribution (KES 500)",
      dueDate: "2026-10-09",
      amount: 500,
      category: "NSSF",
      isRecurring: true,
      recurringInterval: "monthly",
      status: "pending",
      uid
    });
    console.log("Seeded NSSF monthly reminder for October 2026");
  }
};

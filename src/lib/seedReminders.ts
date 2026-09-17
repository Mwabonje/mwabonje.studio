import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const seedHealthInsuranceReminder = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const reminderId = "health-insurance-reminder-1";
  
  // Set the first reminder to Feb 10, 2027
  await setDoc(doc(db, `users/${uid}/reminders`, reminderId), {
    id: reminderId,
    title: "Health Insurance Payment",
    description: "Monthly health insurance premium",
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

import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkSteve() {
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);
  
  if (usersSnapshot.empty) {
    console.log("No users found");
    return;
  }
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`Checking user: ${userId}`);
    
    // Check clients
    const clientsRef = collection(db, `users/${userId}/clients`);
    const clientsSnap = await getDocs(clientsRef);
    let steveClientId = null;
    clientsSnap.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('steve')) {
        console.log(`Found client Steve Omae: ${doc.id}`, data);
        steveClientId = doc.id;
      }
    });

    // Check collaborators in projects
    const projectsRef = collection(db, `users/${userId}/projects`);
    const projectsSnap = await getDocs(projectsRef);
    projectsSnap.forEach(doc => {
      const data = doc.data();
      let hasSteve = false;
      if (data.collaborators) {
        data.collaborators.forEach((c) => {
          if (c.name && c.name.toLowerCase().includes('steve')) {
            console.log(`Found collaborator Steve Omae in project ${doc.id}:`, c);
            hasSteve = true;
          }
        });
      }
      if (steveClientId && data.clientId === steveClientId) {
        console.log(`Project for client Steve: ${doc.id}`);
      }
    });
    
    // Check invoices
    const invoicesRef = collection(db, `users/${userId}/invoices`);
    const invoicesSnap = await getDocs(invoicesRef);
    invoicesSnap.forEach(doc => {
      if (steveClientId && doc.data().clientId === steveClientId) {
        console.log(`Invoice for client Steve: ${doc.id}`, doc.data());
      }
    });

    // Check payments
    const paymentsRef = collection(db, `users/${userId}/payments`);
    const paymentsSnap = await getDocs(paymentsRef);
    paymentsSnap.forEach(doc => {
      // payment.invoiceId...
      // Just list all payments for debugging
      console.log(`Payment: ${doc.id}`, doc.data());
    });
  }
  
  process.exit(0);
}

checkSteve().catch(console.error);

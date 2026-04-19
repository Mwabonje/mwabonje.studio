import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore, Client, Project, Quote, Invoice, Payment, Settings } from '../store';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setAuthReady = useStore((state) => state.setAuthReady);
  const userId = useStore((state) => state.userId);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthReady(true, user.uid);
        // Create a top-level document so the user can see their data in the Firebase Console
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Error creating user document:", e);
        }
      } else {
        setAuthReady(true, null);
        useStore.setState({
          clients: [],
          projects: [],
          quotes: [],
          invoices: [],
          payments: [],
        });
      }
    });

    return () => unsubscribeAuth();
  }, [setAuthReady]);

  useEffect(() => {
    if (!userId) return;

    const unsubClients = onSnapshot(query(collection(db, `users/${userId}/clients`)), (snapshot) => {
      const clients = snapshot.docs.map((doc) => doc.data() as Client);
      useStore.setState({ clients });
    });

    const unsubProjects = onSnapshot(query(collection(db, `users/${userId}/projects`)), (snapshot) => {
      const projects = snapshot.docs.map((doc) => doc.data() as Project);
      useStore.setState({ projects });
    });

    const unsubProjectTemplates = onSnapshot(query(collection(db, `users/${userId}/project_templates`)), (snapshot) => {
      const projectTemplates = snapshot.docs.map((doc) => doc.data() as any);
      useStore.setState({ projectTemplates });
    });

    const unsubQuotes = onSnapshot(query(collection(db, `users/${userId}/quotes`)), (snapshot) => {
      const quotes = snapshot.docs.map((doc) => doc.data() as Quote);
      useStore.setState({ quotes });
    });

    const unsubInvoices = onSnapshot(query(collection(db, `users/${userId}/invoices`)), (snapshot) => {
      const invoices = snapshot.docs.map((doc) => doc.data() as Invoice);
      useStore.setState({ invoices });
    });

    const unsubPayments = onSnapshot(query(collection(db, `users/${userId}/payments`)), (snapshot) => {
      const payments = snapshot.docs.map((doc) => doc.data() as Payment);
      useStore.setState({ payments });
    });

    const unsubSettings = onSnapshot(doc(db, `users/${userId}/settings/profile`), (docSnap) => {
      if (docSnap.exists()) {
        useStore.setState({ settings: docSnap.data() as Settings, isSettingsLoaded: true });
      } else {
        useStore.setState({ isSettingsLoaded: true });
      }
    });

    return () => {
      unsubClients();
      unsubProjects();
      unsubProjectTemplates();
      unsubQuotes();
      unsubInvoices();
      unsubPayments();
      unsubSettings();
    };
  }, [userId]);

  return <>{children}</>;
};

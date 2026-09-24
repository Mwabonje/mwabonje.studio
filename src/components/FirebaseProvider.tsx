import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore, Client, Project, Quote, Invoice, Payment, Settings, Feedback, defaultSettings } from '../store';
import { isSuperUser } from '../lib/auth-utils';

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
          feedbacks: [],
          settings: defaultSettings,
          isSettingsLoaded: false,
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
    }, (error) => {
      console.error("Firebase clients error:", error);
    });

    const unsubProjects = onSnapshot(query(collection(db, `users/${userId}/projects`)), (snapshot) => {
      const projects = snapshot.docs.map((doc) => doc.data() as Project);
      useStore.setState({ projects });
    }, (error) => {
      console.error("Firebase projects error:", error);
    });

    const unsubProjectTemplates = onSnapshot(query(collection(db, `users/${userId}/project_templates`)), (snapshot) => {
      const projectTemplates = snapshot.docs.map((doc) => doc.data() as any);
      useStore.setState({ projectTemplates });
    }, (error) => {
      console.error("Firebase project templates error:", error);
    });

    const unsubQuotes = onSnapshot(query(collection(db, `users/${userId}/quotes`)), (snapshot) => {
      const quotes = snapshot.docs.map((doc) => doc.data() as Quote);
      useStore.setState({ quotes });
    }, (error) => {
      console.error("Firebase quotes error:", error);
    });

    const unsubInvoices = onSnapshot(query(collection(db, `users/${userId}/invoices`)), (snapshot) => {
      const invoices = snapshot.docs.map((doc) => doc.data() as Invoice);
      useStore.setState({ invoices });
    }, (error) => {
      console.error("Firebase invoices error:", error);
    });

    const unsubPayments = onSnapshot(query(collection(db, `users/${userId}/payments`)), (snapshot) => {
      const payments = snapshot.docs.map((doc) => doc.data() as Payment);
      useStore.setState({ payments });
    }, (error) => {
      console.error("Firebase payments error:", error);
    });

    const unsubEquipment = onSnapshot(query(collection(db, `users/${userId}/equipment`)), (snapshot) => {
      const equipment = snapshot.docs.map((doc) => doc.data() as any);
      useStore.setState({ equipment });
    }, (error) => {
      console.error("Firebase equipment error:", error);
    });

    const unsubExpenses = onSnapshot(query(collection(db, `users/${userId}/expenses`)), (snapshot) => {
      const expenses = snapshot.docs.map((doc) => doc.data() as any);
      useStore.setState({ expenses });
    }, (error) => {
      console.error("Firebase expenses error:", error);
    });

    
    const unsubReminders = onSnapshot(query(collection(db, `users/${userId}/reminders`)), (snapshot) => {
      const reminders = snapshot.docs.map((doc) => doc.data() as any);
      useStore.setState({ reminders });
    }, (error) => {
      console.error("Firebase reminders error:", error);
    });

    // Check if user has cached settings in localStorage for immediate rendering
    try {
      const cached = localStorage.getItem(`capturecrm_settings_${userId}`);
      if (cached) {
        useStore.setState({ settings: { ...defaultSettings, ...JSON.parse(cached) } });
      }
    } catch (e) {}

    const unsubSettings = onSnapshot(doc(db, `users/${userId}/settings/profile`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        useStore.setState({ settings: { ...defaultSettings, ...data }, isSettingsLoaded: true });
        try {
          localStorage.setItem(`capturecrm_settings_${userId}`, JSON.stringify(data));
        } catch (e) {}
      } else {
        useStore.setState({ isSettingsLoaded: true });
      }
    }, (error) => {
      console.error("Firebase settings error:", error);
      useStore.setState({ isSettingsLoaded: true });
    });

    const userIsSuper = isSuperUser(auth.currentUser?.email);
    const feedbackQuery = userIsSuper
      ? query(collection(db, 'feedbacks'))
      : query(collection(db, 'feedbacks'), where('userId', '==', userId));

    const unsubFeedbacks = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbacks = snapshot.docs.map((doc) => doc.data() as Feedback);
      // Sort newest first
      feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      useStore.setState({ feedbacks });
    }, (error) => {
      console.error("Firebase feedbacks error:", error);
    });

    return () => {
      unsubClients();
      unsubProjects();
      unsubProjectTemplates();
      unsubQuotes();
      unsubInvoices();
      unsubPayments();
      unsubEquipment();
      unsubExpenses();
      unsubReminders();
      unsubSettings();
      unsubFeedbacks();
    };
  }, [userId]);

  return <>{children}</>;
};

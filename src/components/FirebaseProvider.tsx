import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore, touchUserActivity, Client, Project, Quote, Invoice, Payment, Settings, Feedback, defaultSettings } from '../store';
import { isSuperUser } from '../lib/auth-utils';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setAuthReady = useStore((state) => state.setAuthReady);
  const userId = useStore((state) => state.userId);

  useEffect(() => {
    let heartbeatTimer: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthReady(true, user.uid);
        // Create a top-level document so the user can see their data in the Firebase Console
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            lastLogin: new Date().toISOString()
          }, { merge: true });

          const isSuper = isSuperUser(user.email);
          const now = new Date().toISOString();
          const userDocRef = doc(db, 'system_users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // Initial registration of new user account
            const newUser = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Studio User',
              role: isSuper ? 'super_admin' : 'photographer',
              status: 'active',
              joinedAt: now,
              lastActiveAt: now,
            };
            await setDoc(userDocRef, newUser);

            // Record registration audit log
            const auditId = 'log_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            await setDoc(doc(db, 'audit_logs', auditId), {
              id: auditId,
              timestamp: now,
              actorId: user.uid,
              actorEmail: user.email || 'unknown',
              actorName: user.displayName || user.email?.split('@')[0] || 'User',
              category: 'auth',
              action: 'USER_REGISTERED',
              description: `New user account initialized for ${user.email} (${isSuper ? 'Super Admin' : 'Lead Photographer'})`,
              severity: 'info',
              targetResourceId: user.uid,
              targetResourceType: 'system_users',
            });
          } else {
            // Existing user login: update lastActiveAt, never reset admin-assigned role or status!
            await setDoc(userDocRef, {
              lastActiveAt: now,
              ...(user.displayName ? { displayName: user.displayName } : {}),
              ...(isSuper ? { role: 'super_admin' } : {})
            }, { merge: true });

            // Record login audit log
            const auditId = 'log_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            await setDoc(doc(db, 'audit_logs', auditId), {
              id: auditId,
              timestamp: now,
              actorId: user.uid,
              actorEmail: user.email || 'unknown',
              actorName: user.displayName || user.email?.split('@')[0] || 'User',
              category: 'auth',
              action: 'USER_LOGIN',
              description: `User ${user.email} logged in to studio console`,
              severity: 'info',
              targetResourceId: user.uid,
              targetResourceType: 'system_users',
            });
          }
        } catch (e) {
          console.error("Error creating/updating user document:", e);
        }

        // Active session heartbeat + focus/visibility activity tracking
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          touchUserActivity(true);
        }, 2.5 * 60 * 1000);

      } else {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        setAuthReady(true, null);
        useStore.setState({
          clients: [],
          projects: [],
          projectTemplates: [],
          quotes: [],
          invoices: [],
          payments: [],
          equipment: [],
          expenses: [],
          reminders: [],
          feedbacks: [],
          registeredAuthUsers: [],
          settings: defaultSettings,
          isSettingsLoaded: false,
        });
      }
    });

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        touchUserActivity();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      unsubscribeAuth();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [setAuthReady]);

  useEffect(() => {
    if (!userId) {
      useStore.setState({
        clients: [],
        projects: [],
        projectTemplates: [],
        quotes: [],
        invoices: [],
        payments: [],
        equipment: [],
        expenses: [],
        reminders: [],
      });
      return;
    }

    // Reset store lists to empty when switching to a different user
    useStore.setState({
      clients: [],
      projects: [],
      projectTemplates: [],
      quotes: [],
      invoices: [],
      payments: [],
      equipment: [],
      expenses: [],
      reminders: [],
    });

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

    const unsubAnnouncements = onSnapshot(query(collection(db, 'system_announcements')), (snapshot) => {
      const announcements = snapshot.docs.map((doc) => doc.data() as any);
      useStore.setState({ announcements });
    }, (error) => {
      console.error("Firebase announcements error:", error);
    });

    let unsubSchoolDeposits = () => {};
    let unsubSchoolMeta = () => {};
    let unsubSystemUsers = () => {};
    let unsubAuthUsers = () => {};
    let unsubAuditLogs = () => {};

    if (userIsSuper) {
      unsubSystemUsers = onSnapshot(query(collection(db, 'system_users')), (snapshot) => {
        const systemUsers = snapshot.docs.map((doc) => doc.data() as any);
        useStore.setState({ systemUsers });
      }, (error) => {
        console.error("Firebase system_users error:", error);
      });

      unsubAuthUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
        const registeredAuthUsers = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as { email?: string; lastLogin?: string }),
        }));
        useStore.setState({ registeredAuthUsers });
      }, (error) => {
        console.warn("Firebase users list error:", error);
      });

      unsubAuditLogs = onSnapshot(query(collection(db, 'audit_logs')), (snapshot) => {
        const auditLogs = snapshot.docs.map((doc) => doc.data() as any);
        auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        useStore.setState({ auditLogs });
      }, (error) => {
        console.error("Firebase audit_logs error:", error);
      });

      try {
        const cachedSchoolMeta = localStorage.getItem(`capturecrm_school_meta_${userId}`) || localStorage.getItem('capturecrm_school_meta');
        if (cachedSchoolMeta) {
          useStore.setState((prev) => ({
            schoolAccountMeta: { ...prev.schoolAccountMeta, ...JSON.parse(cachedSchoolMeta) }
          }));
        }
      } catch (e) {}

      unsubSchoolDeposits = onSnapshot(query(collection(db, `users/${userId}/school_deposits`)), (snapshot) => {
        const schoolDeposits = snapshot.docs.map((doc) => doc.data() as any);
        schoolDeposits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        useStore.setState({ schoolDeposits });
      }, (error) => {
        console.error("Firebase school deposits error:", error);
      });

      unsubSchoolMeta = onSnapshot(doc(db, `users/${userId}/school_deposits_meta/account`), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          useStore.setState((prev) => ({
            schoolAccountMeta: { ...prev.schoolAccountMeta, ...data }
          }));
          try {
            localStorage.setItem(`capturecrm_school_meta_${userId}`, JSON.stringify(data));
            localStorage.setItem('capturecrm_school_meta', JSON.stringify(data));
          } catch (e) {}
        }
      }, (error) => {
        console.error("Firebase school meta error:", error);
      });
    } else {
      unsubSystemUsers = onSnapshot(doc(db, 'system_users', userId), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as any;
          useStore.setState({ systemUsers: [userData] });
        }
      }, (error) => {
        console.warn("Firebase personal user profile error:", error);
      });
    }

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
      unsubAnnouncements();
      unsubSchoolDeposits();
      unsubSchoolMeta();
      unsubSystemUsers();
      unsubAuthUsers();
      unsubAuditLogs();
    };
  }, [userId]);

  return <>{children}</>;
};

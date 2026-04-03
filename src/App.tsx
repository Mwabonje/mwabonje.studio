/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Projects } from '@/pages/Projects';
import { Quotes } from '@/pages/Quotes';
import { Invoices } from '@/pages/Invoices';
import { Payments } from '@/pages/Payments';
import { Performance } from '@/pages/Performance';
import { SharedQuote } from '@/pages/SharedQuote';
import { SharedInvoice } from '@/pages/SharedInvoice';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import { Toaster } from 'sonner';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { AuthGuard } from '@/components/AuthGuard';

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/quote/shared" element={<SharedQuote />} />
          <Route path="/invoice/shared" element={<SharedInvoice />} />
          
          <Route element={<AuthGuard />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="projects" element={<Projects />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="performance" element={<Performance />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </FirebaseProvider>
  );
}

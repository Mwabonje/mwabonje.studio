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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="performance" element={<Performance />} />
        </Route>
        <Route path="/quote/shared" element={<SharedQuote />} />
      </Routes>
    </Router>
  );
}

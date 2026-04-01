import React from 'react';
import { useStore, Project } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wallet, Clock, FileText, Calendar } from 'lucide-react';
import { isSameMonth } from 'date-fns';

export function Performance() {
  const { projects, quotes, invoices, payments } = useStore();

  // 1. Total Earning
  const totalEarning = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // 2. Net Earning (Personal Takes)
  const calculateNetEarning = () => {
    let totalNet = 0;

    projects.forEach((project) => {
      const projectInvoices = invoices.filter((i) => i.projectId === project.id);
      const projectRevenue = projectInvoices.reduce((sum, i) => sum + i.amountPaid, 0);

      if (projectRevenue === 0) return;

      // Check if this project has an approved quote with collaboration settings
      const projectQuote = quotes.find(q => q.projectId === project.id && q.status === 'approved');
      
      if (projectQuote?.isCollaboration) {
        // The user is taking a cut of the total project revenue
        const myCut = projectQuote.collaborationType === 'percentage' 
          ? (projectRevenue * (projectQuote.collaborationCut || 0) / 100)
          : Math.min(projectRevenue, projectQuote.collaborationCut || 0);
        totalNet += myCut;
        return;
      }

      if (!project.collaborators || project.collaborators.length === 0) {
        totalNet += projectRevenue;
        return;
      }

      const equalSplitCount = project.collaborators.filter((c) => c.splitType === 'equal').length;
      const percentageCollaborators = project.collaborators.filter((c) => c.splitType === 'percentage');

      let totalPercentageAllocated = percentageCollaborators.reduce((sum, c) => sum + (c.percentage || 0), 0);
      if (totalPercentageAllocated > 100) totalPercentageAllocated = 100;

      const remainingPercentageForEqual = 100 - totalPercentageAllocated;
      const equalPercentage = equalSplitCount > 0 ? remainingPercentageForEqual / equalSplitCount : 0;

      let collaboratorTotal = 0;
      project.collaborators.forEach((c) => {
        const percentage = c.splitType === 'percentage' ? c.percentage || 0 : equalPercentage;
        collaboratorTotal += (projectRevenue * percentage) / 100;
      });

      // Personal take is whatever is left after paying collaborators
      // If 100% is given to collaborators, personal take is 0.
      totalNet += (projectRevenue - collaboratorTotal);
    });

    return totalNet;
  };

  const netEarning = calculateNetEarning();

  // 3. Pending Balances
  const pendingBalances = invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.amountPaid), 0);

  // 4. Open Quotes
  const openQuotes = quotes.filter((q) => q.status === 'draft' || q.status === 'sent').length;

  // 5. Monthly Earning
  const currentMonth = new Date();
  const monthlyEarning = payments
    .filter((p) => isSameMonth(new Date(p.date), currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    {
      title: 'Total Earning',
      value: `Ksh ${totalEarning.toLocaleString()}`,
      icon: DollarSign,
      description: 'Total revenue across all projects',
    },
    {
      title: 'Net Earning',
      value: `Ksh ${netEarning.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Wallet,
      description: 'Your personal take after collaborator splits',
    },
    {
      title: 'Pending Balances',
      value: `Ksh ${pendingBalances.toLocaleString()}`,
      icon: Clock,
      description: 'Unpaid amounts from issued invoices',
    },
    {
      title: 'Open Quotes',
      value: openQuotes.toString(),
      icon: FileText,
      description: 'Quotes awaiting client approval',
    },
    {
      title: 'Monthly Earning',
      value: `Ksh ${monthlyEarning.toLocaleString()}`,
      icon: Calendar,
      description: 'Earnings received this month',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Performance Overview</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

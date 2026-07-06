import React, { useState } from 'react';
import { useStore, Project } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wallet, Clock, FileText, Calendar, ChevronLeft, ChevronRight, Download, Car } from 'lucide-react';
import { isSameMonth, isSameYear, format, subMonths, addMonths, addYears, subYears } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

export function Performance() {
  const { projects, quotes, invoices, payments } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // 1. Total Earning
  const totalEarning = payments
    .filter(p => isSameYear(new Date(p.date), selectedMonth))
    .reduce((sum, payment) => sum + payment.amount, 0);

  // 2. Net Earning (Personal Takes)
  const calculateNetEarning = (yearly: boolean = false) => {
    let totalNet = 0;

    // Collect all project IDs that exist
    const projectIds = new Set(projects.map(p => p.id));

    // Handle standalone invoices (no project, or project deleted)
    invoices.forEach(invoice => {
      if (!invoice.projectId || invoice.projectId === 'none' || !projectIds.has(invoice.projectId)) {
        const invoicePaymentsForMonth = payments
          .filter(p => p.invoiceId === invoice.id && (yearly ? isSameYear(new Date(p.date), selectedMonth) : isSameMonth(new Date(p.date), selectedMonth)))
          .reduce((sum, p) => sum + p.amount, 0);
        totalNet += invoicePaymentsForMonth;
      }
    });

    projects.forEach((project) => {
      const projectInvoices = invoices.filter((i) => i.projectId === project.id);
      const projectRevenue = payments
        .filter(p => (yearly ? isSameYear(new Date(p.date), selectedMonth) : isSameMonth(new Date(p.date), selectedMonth)) && projectInvoices.some(i => i.id === p.invoiceId))
        .reduce((sum, p) => sum + p.amount, 0);

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

      const totalProjectRevenueAllTime = payments
        .filter(p => projectInvoices.some(i => i.id === p.invoiceId))
        .reduce((sum, p) => sum + p.amount, 0);

      const fixedExpenses = project.collaborators
        .filter(c => c.splitType === 'fixed' || c.splitType === 'transport')
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      const monthRatio = totalProjectRevenueAllTime > 0 ? projectRevenue / totalProjectRevenueAllTime : 0;
      const netProjectRevenueForMonth = Math.max(0, totalProjectRevenueAllTime - fixedExpenses) * monthRatio;

      const equalSplitCount = project.collaborators.filter((c) => c.splitType === 'equal').length;
      const percentageCollaborators = project.collaborators.filter((c) => c.splitType === 'percentage');

      let totalPercentageAllocated = percentageCollaborators.reduce((sum, c) => sum + (c.percentage || 0), 0);
      if (totalPercentageAllocated > 100) totalPercentageAllocated = 100;

      const remainingPercentageForEqual = 100 - totalPercentageAllocated;
      // Divide remaining percentage equally among collaborators PLUS the user (hence + 1)
      const equalPercentage = equalSplitCount > 0 ? remainingPercentageForEqual / (equalSplitCount + 1) : 0;

      let collaboratorTotal = 0;
      project.collaborators.forEach((c) => {
        if (c.splitType === 'percentage' || c.splitType === 'equal') {
          const percentage = c.splitType === 'percentage' ? c.percentage || 0 : equalPercentage;
          collaboratorTotal += (netProjectRevenueForMonth * percentage) / 100;
        }
      });

      // Personal take is whatever is left of the month's net revenue after paying percentage/equal collaborators
      totalNet += Math.max(0, netProjectRevenueForMonth - collaboratorTotal);
    });

    return totalNet;
  };

  const calculateTransportExpenses = (yearly: boolean = false) => {
    let totalTransport = 0;
    projects.forEach((project) => {
      const projectInvoices = invoices.filter((i) => i.projectId === project.id);
      const projectRevenue = payments
        .filter(p => (yearly ? isSameYear(new Date(p.date), selectedMonth) : isSameMonth(new Date(p.date), selectedMonth)) && projectInvoices.some(i => i.id === p.invoiceId))
        .reduce((sum, p) => sum + p.amount, 0);

      if (projectRevenue === 0 || !project.collaborators) return;

      const transportExpenses = project.collaborators
        .filter(c => c.splitType === 'transport')
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const totalProjectRevenueAllTime = payments
        .filter(p => projectInvoices.some(i => i.id === p.invoiceId))
        .reduce((sum, p) => sum + p.amount, 0);

      const monthRatio = totalProjectRevenueAllTime > 0 ? projectRevenue / totalProjectRevenueAllTime : 0;
      totalTransport += transportExpenses * monthRatio;
    });
    return totalTransport;
  };

  const netEarning = calculateNetEarning(false);
  const totalNetEarning = calculateNetEarning(true);
  const monthlyTransport = calculateTransportExpenses(false);
  const yearlyTransport = calculateTransportExpenses(true);

  // 3. Pending Balances
  const pendingBalances = invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.amountPaid), 0);

  // 4. Open Quotes
  const openQuotes = quotes.filter((q) => q.status === 'draft' || q.status === 'sent').length;

  // 5. Monthly Earning
  const monthlyEarning = payments
    .filter((p) => isSameMonth(new Date(p.date), selectedMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthPickerAction = (
    <div className="flex items-center space-x-1 mt-1">
      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
        <ChevronLeft className="w-3 h-3" />
      </Button>
      <span className="text-xs font-semibold w-20 text-center">{format(selectedMonth, 'MMM yyyy')}</span>
      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
        <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );

  const yearPickerAction = (
    <div className="flex items-center space-x-1 mt-1">
      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setSelectedMonth(subYears(selectedMonth, 1))}>
        <ChevronLeft className="w-3 h-3" />
      </Button>
      <span className="text-xs font-semibold w-20 text-center">{format(selectedMonth, 'yyyy')}</span>
      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setSelectedMonth(addYears(selectedMonth, 1))}>
        <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );

  const stats = [
    {
      title: 'Total Earning',
      value: `Ksh ${totalEarning.toLocaleString()}`,
      rawValue: totalEarning,
      icon: DollarSign,
      description: `Total revenue across all projects in ${format(selectedMonth, 'yyyy')}`,
      action: yearPickerAction
    },
    {
      title: 'Total Net Earning',
      value: `Ksh ${totalNetEarning.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      rawValue: totalNetEarning,
      icon: Wallet,
      description: `Your personal take after collaborator splits in ${format(selectedMonth, 'yyyy')}`,
      action: yearPickerAction
    },
    {
      title: 'Net Earning',
      value: `Ksh ${netEarning.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      rawValue: netEarning,
      icon: Wallet,
      description: `Your personal take after collaborator splits in ${format(selectedMonth, 'MMM yyyy')}`,
      action: monthPickerAction
    },
    {
      title: 'Pending Balances',
      value: `Ksh ${pendingBalances.toLocaleString()}`,
      rawValue: pendingBalances,
      icon: Clock,
      description: 'Unpaid amounts from issued invoices',
    },
    {
      title: 'Open Quotes',
      value: openQuotes.toString(),
      rawValue: openQuotes,
      icon: FileText,
      description: 'Quotes awaiting client approval',
    },
    {
      title: `Monthly Earning`,
      value: `Ksh ${monthlyEarning.toLocaleString()}`,
      rawValue: monthlyEarning,
      icon: Calendar,
      description: `Earnings received in ${format(selectedMonth, 'MMMM yyyy')}`,
      action: monthPickerAction
    },
    {
      title: 'Transport Expenses (Monthly)',
      value: `Ksh ${monthlyTransport.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      rawValue: monthlyTransport,
      icon: Car,
      description: `Transport expenses deducted in ${format(selectedMonth, 'MMM yyyy')}`,
      action: monthPickerAction
    },
    {
      title: 'Transport Expenses (Yearly)',
      value: `Ksh ${yearlyTransport.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      rawValue: yearlyTransport,
      icon: Car,
      description: `Transport expenses deducted in ${format(selectedMonth, 'yyyy')}`,
      action: yearPickerAction
    },
  ];

  const handleExportCSV = () => {
    const headers = ['Metric', 'Amount/Value', 'Description'];
    const csvContent = [
      headers.join(','),
      ...stats.map(stat => 
        [
          `"${stat.title}"`,
          `"${stat.rawValue}"`,
          `"${stat.description}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_export_${format(selectedMonth, 'MMM_yyyy')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
    
    const revenue = payments
      .filter(p => new Date(p.date).getFullYear() === selectedMonth.getFullYear() && new Date(p.date).getMonth() === i)
      .reduce((sum, p) => sum + p.amount, 0);

    const projectCount = projects.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === i;
    }).length;

    return {
      name: monthName,
      Revenue: revenue,
      Projects: projectCount
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Performance Overview</h2>
        <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex flex-col">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                {stat.action}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
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

      <div className="mt-8">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Revenue & Projects Overview
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Monthly breakdown of revenue and number of projects for {selectedMonth.getFullYear()}
                </p>
              </div>
              {yearPickerAction}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `Ksh ${value.toLocaleString()}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [
                      name === 'Revenue' ? `Ksh ${value.toLocaleString()}` : value,
                      name
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" dataKey="Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Revenue Heatmap
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Peak booking months and seasonal income trends for {selectedMonth.getFullYear()}
                </p>
              </div>
              {yearPickerAction}
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 pt-4">
              {Array.from({ length: 12 }, (_, i) => {
                const revenue = payments
                  .filter(p => new Date(p.date).getFullYear() === selectedMonth.getFullYear() && new Date(p.date).getMonth() === i)
                  .reduce((sum, p) => sum + p.amount, 0);
                
                const allRevenues = Array.from({ length: 12 }, (_, j) => 
                  payments
                    .filter(p => new Date(p.date).getFullYear() === selectedMonth.getFullYear() && new Date(p.date).getMonth() === j)
                    .reduce((sum, p) => sum + p.amount, 0)
                );
                
                const maxRev = Math.max(...allRevenues, 1);
                
                let scale = 0;
                if (revenue > 0) {
                  scale = Math.ceil((revenue / maxRev) * 5);
                }

                const colors = [
                  'bg-slate-100', // 0
                  'bg-emerald-100', // 1
                  'bg-emerald-300', // 2
                  'bg-emerald-500', // 3
                  'bg-emerald-700', // 4
                  'bg-emerald-900'  // 5
                ];
                
                const heatmapMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                return (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1 min-w-[3rem] relative group cursor-pointer">
                    <div 
                      className={`w-full aspect-square rounded-md ${colors[scale]} transition-all duration-300 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-emerald-500 group-hover:scale-105`} 
                    ></div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{heatmapMonths[i]}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:flex flex-col items-center z-10 pointer-events-none drop-shadow-md transition-all">
                      <div className="bg-slate-900 text-white text-xs py-1.5 px-3 rounded-md whitespace-nowrap font-medium">
                        {heatmapMonths[i]} {selectedMonth.getFullYear()}: <span className="text-emerald-400">Ksh {revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5 hidden group-hover:block"></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 mb-4 flex items-center justify-end gap-2 text-xs text-slate-500 font-medium">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-100"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-300"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-700"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-900"></div>
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

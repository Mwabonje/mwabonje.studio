import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { MoreHorizontal, ChevronLeft, ChevronRight, Plus, Camera, Trash2, Activity, CreditCard, FileText, UserPlus, FileCheck, ArrowUpRight, Receipt, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionTooltip } from '@/components/ui/tooltip';

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, quotes, clients, invoices, payments, deleteProject, addProject, deleteQuote } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isClearQuotesDialogOpen, setIsClearQuotesDialogOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    clientId: '',
    location: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const monthContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (monthContainerRef.current) {
      const selectedButton = monthContainerRef.current.children[currentDate.getMonth()] as HTMLElement;
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentDate]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProject({
      id: crypto.randomUUID(),
      ...eventFormData,
      collaborators: [],
    });
    setIsEventDialogOpen(false);
    setEventFormData({
      title: '',
      clientId: '',
      location: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    });
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Check if day has projects
      const dayProjects = projects.filter(p => isSameDay(new Date(p.date), cloneDay));
      
      days.push(
        <div
          key={day.toString()}
          className={cn(
            "relative flex flex-col items-center py-1 sm:py-2 cursor-pointer h-12 sm:h-14",
            !isSameMonth(day, monthStart) ? "text-slate-300" : "text-slate-700",
          )}
          onClick={() => setSelectedDate(cloneDay)}
        >
          <div className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-xs sm:text-sm transition-colors z-10",
            isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground font-bold shadow-md" : "hover:bg-slate-100"
          )}>
            {formattedDate}
          </div>
          {/* Dot indicator for events */}
          {dayProjects.length > 0 && !isSameDay(day, selectedDate) && (
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 absolute bottom-1 sm:bottom-2"></div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-y-2 sm:gap-y-4 gap-x-1 sm:gap-x-2" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Selected day events
  const selectedDayEvents = projects.filter(p => isSameDay(new Date(p.date), selectedDate));

  // Upcoming shoots (future projects)
  const upcomingShoots = projects
    .filter(p => new Date(p.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  // Recent quotes
  const recentQuotes = quotes
    .sort((a, b) => new Date(b.issueDate || b.date).getTime() - new Date(a.issueDate || a.date).getTime())
    .slice(0, 2);

  const pendingInvoices = invoices.filter(i => (i.totalAmount - (i.amountPaid || 0)) > 0);
  const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.totalAmount - (i.amountPaid || 0)), 0);

  const upcomingDeadlinesCount = projects.filter(p => new Date(p.date) >= new Date(new Date().setHours(0,0,0,0))).length;

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-full xl:h-full">
      {/* Calendar Section */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-sm flex flex-col md:flex-row overflow-hidden border border-slate-100 min-h-[600px]">
        {/* Left Panel (Primary Color) */}
        <div className="w-full md:w-[38%] lg:w-[35%] bg-primary text-primary-foreground p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <MoreHorizontal className="w-6 h-6 text-primary-foreground/70 mb-4 sm:mb-8 md:mb-12" />
            <div className="mb-6 sm:mb-8 md:mb-12">
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-1 sm:mb-2">{format(selectedDate, 'd')}</h1>
              <p className="text-lg sm:text-xl md:text-2xl tracking-widest uppercase font-medium text-primary-foreground/90">{format(selectedDate, 'EEEE')}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold tracking-widest mb-6 text-primary-foreground/90 uppercase">Current Events</h3>
              {selectedDayEvents.length === 0 ? (
                <p className="text-primary-foreground/80 text-sm mb-6">No bookings on this day</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {selectedDayEvents.map(event => {
                    const client = clients.find(c => c.id === event.clientId);
                    return (
                      <div key={event.id} className="bg-white/10 p-4 rounded-xl relative group">
                        <div className="pr-8">
                          <p className="font-semibold text-lg">{event.title}</p>
                          <p className="text-sm text-primary-foreground/70 mt-1">{client?.name || 'Unknown Client'} • {event.location}</p>
                        </div>
                        <button 
                          onClick={() => deleteProject(event.id)}
                          className="absolute top-4 right-4 text-primary-foreground/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <a href="#" className="text-sm text-primary-foreground/70 hover:text-white underline underline-offset-4 transition-colors">See past events</a>
            </div>
          </div>
          
          <div className="mt-8 md:mt-12">
            <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
              <DialogTrigger className="w-full block text-left">
                <div className="flex items-center justify-between border-b border-primary-foreground/20 pb-4 cursor-pointer group">
                  <span className="text-sm text-primary-foreground/80 group-hover:text-white transition-colors">Create an Event</span>
                  <Plus className="w-5 h-5 text-primary-foreground/80 group-hover:text-white transition-colors" />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Event Title</Label>
                    <Input
                      id="event-title"
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-client">Client</Label>
                    <Select
                      value={eventFormData.clientId}
                      onValueChange={(value) => setEventFormData({ ...eventFormData, clientId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Event</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right Panel (Calendar Grid) */}
        <div className="w-full md:w-[62%] lg:w-[65%] p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col bg-white">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-12">
            <div ref={monthContainerRef} className="flex-1 min-w-0 flex gap-6 overflow-x-auto hide-scrollbar mr-4">
              {months.map((m, i) => (
                <button 
                  key={m}
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), i, 1))}
                  className={cn(
                    "text-sm pb-1 px-1 border-b-2 transition-colors shrink-0 whitespace-nowrap",
                    currentDate.getMonth() === i 
                      ? "border-slate-800 text-slate-800 font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3 text-slate-400 font-medium shrink-0">
              <ActionTooltip content="Previous Month">
                <button onClick={prevMonth} aria-label="Previous Month" className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              </ActionTooltip>
              <span className="text-slate-600 font-bold">{format(currentDate, 'yyyy')}</span>
              <ActionTooltip content="Next Month">
                <button onClick={nextMonth} aria-label="Next Month" className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </ActionTooltip>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-6">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-800 tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col space-y-4">
            {rows}
          </div>
        </div>
      </div>

      {/* Right Sidebar Section */}
      <div className="w-full xl:w-[400px] flex flex-col gap-8 xl:pl-4">
        {/* Summary Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Total Pending Invoices</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">Ksh {totalPendingAmount.toLocaleString()}</span>
              <span className="text-xs font-medium text-slate-400">({pendingInvoices.length} pending)</span>
            </div>
          </div>
          <div className="h-px bg-slate-200 w-full"></div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Upcoming Deadlines</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{upcomingDeadlinesCount}</span>
              <span className="text-xs font-medium text-slate-400">projects scheduled</span>
            </div>
          </div>
        </div>

        {/* System Manual Guide Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/10 rounded-lg text-accent">
                <BookOpen className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">System Manual</span>
            </div>
            <Link to="/guide?tour=true" className="text-[11px] font-semibold text-accent hover:underline flex items-center">
              2-Min Tour <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Need help with Quotes, Legal Contracts, Invoicing, or M-Pesa receipts? Read our step-by-step workflow guide.
          </p>
          <div className="flex gap-2 pt-1">
            <Link to="/guide" className="flex-1">
              <Button size="sm" variant="secondary" className="w-full text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 h-8">
                Explore Manual Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* Upcoming Shoots */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold tracking-widest text-slate-800 uppercase">Upcoming Shoots</h3>
            <Link to="/projects" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors uppercase">View All</Link>
          </div>
          <div className="space-y-6">
            {upcomingShoots.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming shoots.</p>
            ) : (
              upcomingShoots.map(shoot => {
                const client = clients.find(c => c.id === shoot.clientId);
                // Determine status badge
                const projectInvoices = invoices.filter(i => i.projectId === shoot.id);
                const isCleared = projectInvoices.length > 0 && projectInvoices.every(i => i.status === 'paid');
                
                return (
                  <div key={shoot.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{client?.name || shoot.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">
                          {format(new Date(shoot.date), 'MMM dd')} • {shoot.title.split(' ')[0] || 'SHOOT'}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider",
                      isCleared ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                    )}>
                      {isCleared ? 'CLEARED' : 'NOT CLEARED'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Quotes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold tracking-widest text-slate-800 uppercase">Recent Quotes</h3>
            {recentQuotes.length > 0 && (
              <Dialog open={isClearQuotesDialogOpen} onOpenChange={setIsClearQuotesDialogOpen}>
                <DialogTrigger 
                  render={<Button variant="ghost" size="sm" className="text-[10px] text-slate-400 hover:text-red-500 uppercase tracking-wider h-auto py-1 px-2" />}
                >
                  Clear History
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clear Quote History</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-slate-500">Are you sure you want to clear all quotes? This action cannot be undone.</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsClearQuotesDialogOpen(false)}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={async () => {
                        for (const quote of quotes) {
                          await deleteQuote(quote.id);
                        }
                        setIsClearQuotesDialogOpen(false);
                      }}
                    >
                      Clear All Quotes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="space-y-6 mb-0">
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-slate-500">No recent quotes.</p>
            ) : (
              recentQuotes.map(quote => {
                return (
                  <div key={quote.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{quote.clientName || 'Unknown Client'}</p>
                      <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">{quote.projectTitle || 'EDITORIAL PROJECT'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">Ksh {quote.totalAmount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{quote.status}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Link to="/quotes" className="block">
            <Button variant="outline" className="w-full rounded-none border-slate-800 text-slate-800 text-xs font-bold tracking-widest uppercase py-6 hover:bg-slate-50 mb-0 mt-6">
              + Create New Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 lg:bottom-8 lg:right-8 z-30">
        <DropdownMenu>
          <ActionTooltip content="Quick Creation Menu" side="left">
            <DropdownMenuTrigger render={
              <Button size="icon" aria-label="Quick Creation Menu" className="w-14 h-14 rounded-full shadow-xl bg-slate-800 text-white hover:bg-slate-700 hover:scale-105 transition-all">
                <Plus className="w-6 h-6" />
              </Button>
            } />
          </ActionTooltip>
          <DropdownMenuContent align="end" className="w-48 mb-2 p-2">
            <DropdownMenuItem onClick={() => navigate('/clients?new=true')} className="cursor-pointer py-3">
              <UserPlus className="w-4 h-4 mr-3 text-slate-500" />
              <span className="font-medium text-slate-700">New Client</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/projects?new=true')} className="cursor-pointer py-3">
              <Camera className="w-4 h-4 mr-3 text-slate-500" />
              <span className="font-medium text-slate-700">New Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/quotes?new=true')} className="cursor-pointer py-3">
              <FileText className="w-4 h-4 mr-3 text-slate-500" />
              <span className="font-medium text-slate-700">New Quote</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/invoices?new=true')} className="cursor-pointer py-3">
              <Receipt className="w-4 h-4 mr-3 text-slate-500" />
              <span className="font-medium text-slate-700">New Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/guide?tour=true')} className="cursor-pointer py-3 border-t border-slate-100">
              <BookOpen className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium text-slate-700">Manual & Tour</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

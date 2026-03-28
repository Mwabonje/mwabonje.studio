import { useState } from 'react';
import { useStore } from '@/store';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { MoreHorizontal, ChevronLeft, ChevronRight, Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { projects, quotes, clients, invoices } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
            "relative flex flex-col items-center py-2 cursor-pointer h-14",
            !isSameMonth(day, monthStart) ? "text-slate-300" : "text-slate-700",
          )}
          onClick={() => setSelectedDate(cloneDay)}
        >
          <div className={cn(
            "w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors z-10",
            isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground font-bold shadow-md" : "hover:bg-slate-100"
          )}>
            {formattedDate}
          </div>
          {/* Dot indicator for events */}
          {dayProjects.length > 0 && !isSameDay(day, selectedDate) && (
            <div className="w-1 h-1 bg-primary rounded-full mt-1 absolute bottom-2"></div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-y-4 gap-x-2" key={day.toString()}>
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
    .slice(0, 3);

  // Recent quotes
  const recentQuotes = quotes
    .sort((a, b) => new Date(b.issueDate || b.date).getTime() - new Date(a.issueDate || a.date).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col xl:flex-row gap-12 h-full">
      {/* Calendar Section */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-sm flex flex-col md:flex-row overflow-hidden border border-slate-100 min-h-[600px]">
        {/* Left Panel (Primary Color) */}
        <div className="w-full md:w-[35%] bg-primary text-primary-foreground p-6 md:p-10 flex flex-col justify-between">
          <div>
            <MoreHorizontal className="w-6 h-6 text-primary-foreground/70 mb-8 md:mb-12" />
            <div className="mb-8 md:mb-12">
              <h1 className="text-6xl md:text-8xl font-bold mb-2">{format(selectedDate, 'd')}</h1>
              <p className="text-xl md:text-2xl tracking-widest uppercase font-medium text-primary-foreground/90">{format(selectedDate, 'EEEE')}</p>
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
                      <div key={event.id} className="bg-white/10 p-4 rounded-xl">
                        <p className="font-semibold text-lg">{event.title}</p>
                        <p className="text-sm text-primary-foreground/70 mt-1">{client?.name || 'Unknown Client'} • {event.location}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <a href="#" className="text-sm text-primary-foreground/70 hover:text-white underline underline-offset-4 transition-colors">See past events</a>
            </div>
          </div>
          
          <div className="mt-8 md:mt-12">
            <div className="flex items-center justify-between border-b border-primary-foreground/20 pb-4">
              <span className="text-sm text-primary-foreground/80">Create an Event</span>
              <Plus className="w-5 h-5 text-primary-foreground/80 cursor-pointer hover:text-white" />
            </div>
          </div>
        </div>

        {/* Right Panel (Calendar Grid) */}
        <div className="w-full md:w-[65%] p-6 md:p-10 flex flex-col bg-white">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex space-x-6 overflow-x-auto hide-scrollbar">
              {months.map((m, i) => (
                <button 
                  key={m}
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), i, 1))}
                  className={cn(
                    "text-sm pb-1 border-b-2 transition-colors",
                    currentDate.getMonth() === i 
                      ? "border-slate-800 text-slate-800 font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3 text-slate-400 font-medium">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-slate-600 font-bold">{format(currentDate, 'yyyy')}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
      <div className="w-full xl:w-[400px] flex flex-col gap-12 xl:pl-4">
        {/* Upcoming Shoots */}
        <div>
          <div className="flex justify-between items-center mb-8">
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
          <h3 className="text-xs font-bold tracking-widest text-slate-800 uppercase mb-8">Recent Quotes</h3>
          <div className="space-y-6 mb-10">
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
            <Button variant="outline" className="w-full rounded-none border-slate-800 text-slate-800 text-xs font-bold tracking-widest uppercase py-6 hover:bg-slate-50">
              + Create New Quote
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

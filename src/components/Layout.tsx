import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Receipt, CreditCard, PieChart, Menu, X, Settings, Users, Camera, Wallet, FileSignature, BookOpen, HelpCircle, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ReminderPopup } from '@/components/ReminderPopup';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { isSuperUser } from '@/lib/auth-utils';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clients, projects, invoices, quotes, settings, isSettingsLoaded, deleteInvoice, feedbacks } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [userName, setUserName] = useState('Michael');
  const [userFullName, setUserFullName] = useState('Michael');
  const [userInitial, setUserInitial] = useState('M');

  const currentUser = auth.currentUser;
  const isSuper = isSuperUser(currentUser?.email);
  const newFeedbackCount = feedbacks.filter((f) => f.status === 'new').length;

  useEffect(() => {
    // Cleanup orphaned invoices where the associated quote is declined
    const cleanupOrphanedInvoices = async () => {
      for (const invoice of invoices) {
        if (invoice.quoteId && invoice.quoteId !== 'none') {
          const quote = quotes.find(q => q.id === invoice.quoteId);
          if (quote && quote.status === 'declined') {
            await deleteInvoice(invoice.id);
          }
        }
      }
    };
    if (invoices.length > 0 && quotes.length > 0) {
      cleanupOrphanedInvoices();
    }
  }, [invoices, quotes, deleteInvoice]);

  useEffect(() => {
    if (isSettingsLoaded && settings) {
      const hasPrompted = sessionStorage.getItem('hasPromptedSettings');
      if (!hasPrompted && settings.companyName === 'CaptureCRM') {
        toast('Welcome to CaptureCRM!', {
          description: 'Please head over to Settings to add your company details.',
          duration: 8000,
          action: {
            label: 'Go to Settings',
            onClick: () => navigate('/settings'),
          },
        });
        sessionStorage.setItem('hasPromptedSettings', 'true');
      }
    }
  }, [isSettingsLoaded, settings, navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          // Remove any text in parentheses, e.g., "Michael Ringa (Mike)" -> "Michael Ringa"
          const cleanName = user.displayName.replace(/\s*\(.*?\)\s*/g, '').trim();
          // Pick the first name only to prevent truncation in the sidebar
          const firstName = cleanName.split(/\s+/)[0] || cleanName;
          setUserName(firstName);
          setUserFullName(cleanName);
          setUserInitial(firstName.charAt(0).toUpperCase());
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          const firstPart = emailName.split(/[\s._-]+/)[0];
          const formattedFirstName = firstPart ? firstPart.charAt(0).toUpperCase() + firstPart.slice(1) : 'Admin';
          const fullFormatted = emailName.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
          setUserName(formattedFirstName);
          setUserFullName(fullFormatted);
          setUserInitial(formattedFirstName.charAt(0).toUpperCase());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Contracts & NDAs', href: '/contracts', icon: FileSignature },
    { name: 'Invoices', href: '/invoices', icon: Receipt, badge: invoices.filter(i => i.status !== 'paid').length > 0 ? invoices.filter(i => i.status !== 'paid').length : undefined },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Expenses', href: '/expenses', icon: Wallet },
    { name: 'Performance', href: '/performance', icon: PieChart },
    { name: 'Equipment', href: '/equipment', icon: Camera },
    { 
      name: isSuper ? 'Feedback Inbox' : 'Feedback', 
      href: '/feedback', 
      icon: MessageSquarePlus,
      badge: isSuper && newFeedbackCount > 0 ? newFeedbackCount : undefined,
    },
    { name: 'System Guide', href: '/guide', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Bottom navigation items for phone & tablet
  const bottomNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Invoices', href: '/invoices', icon: Receipt, badge: invoices.filter(i => i.status !== 'paid').length > 0 ? invoices.filter(i => i.status !== 'paid').length : undefined },
    { name: 'Payments', href: '/payments', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile/Tablet Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground flex items-center justify-between px-4 z-30 shadow-md">
        <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <h1 className="text-lg sm:text-xl font-bold tracking-widest text-white truncate pr-2">
            {settings?.companyName?.toUpperCase() || 'STUDIO'}
          </h1>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Link 
            to="/feedback"
            className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white rounded-lg active:bg-white/10 transition-colors relative" 
            title={isSuper ? "Feedback Inbox" : "Send Feedback"}
            aria-label={isSuper ? "Feedback Inbox" : "Send Feedback"}
          >
            <MessageSquarePlus className="w-5 h-5" />
            {isSuper && newFeedbackCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-primary animate-pulse" />
            )}
          </Link>
          <Link 
            to="/guide" 
            className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white rounded-lg active:bg-white/10 transition-colors" 
            title="User Manual & Guide"
            aria-label="User Manual & Guide"
          >
            <HelpCircle className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="w-11 h-11 flex items-center justify-center text-white rounded-lg active:bg-white/10 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar (Desktop Persistent & Mobile/Tablet Drawer) */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 transform lg:translate-x-0 transition-transform duration-300 ease-in-out z-50",
        "w-72 sm:w-80 lg:w-72 bg-primary text-primary-foreground flex flex-col rounded-r-2xl lg:rounded-r-[2.5rem] shadow-2xl py-6 sm:py-8",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 lg:px-10 mb-4 sm:mb-6 lg:mb-10 mt-1 lg:mt-0">
          <h1 className="text-xl lg:text-2xl font-bold tracking-widest text-white truncate pr-2" title={settings?.companyName?.toUpperCase() || 'STUDIO'}>
            {settings?.companyName?.toUpperCase() || 'STUDIO'}
          </h1>
          <button 
            onClick={closeMobileMenu} 
            className="lg:hidden w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 rounded-lg shrink-0 transition-colors"
            aria-label="Close Navigation Menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-4 lg:px-8 mb-4 sm:mb-6">
          <GlobalSearch />
        </div>

        <nav className="flex-1 overflow-y-auto hide-scrollbar">
          <ul className="space-y-1.5 sm:space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name} className="relative px-4 lg:px-0 lg:pl-8">
                  <Link
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center px-5 sm:px-6 py-3.5 sm:py-4 text-sm font-medium transition-colors relative z-10 min-h-[44px]",
                      isActive 
                        ? "bg-background text-foreground dark:text-accent rounded-full lg:rounded-r-none lg:rounded-l-full shadow-sm lg:shadow-none font-semibold" 
                        : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground rounded-full lg:mr-8"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 mr-3.5 sm:mr-4 shrink-0", isActive ? "text-accent" : "text-primary-foreground/50")} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className={cn(
                        "ml-auto text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                        isActive ? "bg-primary/10 text-primary dark:bg-accent/20 dark:text-accent" : "bg-white/10 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {isActive && (
                    <div className="hidden lg:block">
                      <div className="absolute -top-5 right-0 w-5 h-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 0 0, transparent 20px, var(--background) 20px)' }} />
                      <div className="absolute -bottom-5 right-0 w-5 h-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 0 100%, transparent 20px, var(--background) 20px)' }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 lg:px-10 mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden mr-2">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg shrink-0">
                {userInitial}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate max-w-[130px]" title={userFullName || userName}>{userName}</p>
                <p className="text-xs text-primary-foreground/60 truncate">Studio Manager</p>
              </div>
            </div>
            <button 
              onClick={() => {
                import('@/lib/firebase').then(({ logout }) => logout());
              }}
              className="w-11 h-11 flex items-center justify-center text-primary-foreground/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden z-10 pt-16 lg:pt-0">
        <div className="flex-1 overflow-y-auto flex flex-col px-3.5 sm:px-6 md:px-8 lg:px-12 pt-4 sm:pt-6 lg:pt-10 pb-24 lg:pb-12">
          <Outlet />
          <ReminderPopup />
          <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
        </div>
      </main>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-slate-200/80 dark:border-border z-30 flex items-center justify-around px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors relative min-w-[56px]",
                isActive ? "text-primary dark:text-accent font-bold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-primary dark:text-accent scale-110" : "text-slate-500 dark:text-slate-400")} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[64px]">{item.name}</span>
              {isActive && (
                <span className="w-4 h-0.5 bg-primary dark:bg-accent rounded-full absolute bottom-1" />
              )}
            </Link>
          );
        })}
        {/* Quick Menu Button for remaining items */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors relative text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 min-w-[56px]",
            isMobileMenuOpen ? "text-primary dark:text-accent font-bold" : ""
          )}
          aria-label="More navigation options"
        >
          <Menu className="w-5 h-5 mb-0.5 text-slate-500 dark:text-slate-400" />
          <span className="truncate">More</span>
        </button>
      </nav>
    </div>
  );
}

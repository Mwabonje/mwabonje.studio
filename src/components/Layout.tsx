import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Receipt, CreditCard, PieChart, Menu, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { auth } from '@/lib/firebase';

export function Layout() {
  const location = useLocation();
  const { clients, projects, invoices, settings } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Mwabonje Admin');
  const [userInitial, setUserInitial] = useState('M');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          // Remove any text in parentheses, e.g., "Michael Ringa (Mike)" -> "Michael Ringa"
          const cleanName = user.displayName.replace(/\s*\(.*?\)\s*/g, '').trim();
          setUserName(cleanName);
          setUserInitial(cleanName.charAt(0).toUpperCase());
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          const formattedName = emailName.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
          setUserName(formattedName);
          setUserInitial(formattedName.charAt(0).toUpperCase());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Invoices', href: '/invoices', icon: Receipt, badge: invoices.filter(i => i.status !== 'paid').length > 0 ? invoices.filter(i => i.status !== 'paid').length : undefined },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Performance', href: '/performance', icon: PieChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground flex items-center justify-between px-4 z-30 shadow-md">
        <h1 className="text-xl font-bold tracking-widest text-white truncate pr-4">{settings?.companyName?.toUpperCase() || 'STUDIO'}</h1>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-white shrink-0">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 transform lg:translate-x-0 transition duration-200 ease-in-out z-50",
        "w-72 bg-primary text-primary-foreground flex flex-col rounded-r-2xl lg:rounded-r-[2.5rem] shadow-2xl py-8",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 lg:px-10 mb-6 lg:mb-10 mt-2 lg:mt-0">
          <h1 className="text-xl lg:text-2xl font-bold tracking-widest text-white truncate pr-2" title={settings?.companyName?.toUpperCase() || 'STUDIO'}>
            {settings?.companyName?.toUpperCase() || 'STUDIO'}
          </h1>
          <button onClick={closeMobileMenu} className="lg:hidden p-2 -mr-2 text-white shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto hide-scrollbar">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name} className="relative px-4 lg:px-0 lg:pl-8">
                  <Link
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center px-6 py-4 text-sm font-medium transition-colors relative z-10",
                      isActive 
                        ? "bg-slate-50 text-primary rounded-full lg:rounded-r-none lg:rounded-l-full" 
                        : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground rounded-full lg:mr-8"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 mr-4", isActive ? "text-accent" : "text-primary-foreground/50")} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className={cn(
                        "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                        isActive ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {isActive && (
                    <div className="hidden lg:block">
                      <div className="absolute -top-5 right-0 w-5 h-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 0 0, transparent 20px, #f8fafc 20px)' }} />
                      <div className="absolute -bottom-5 right-0 w-5 h-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 0 100%, transparent 20px, #f8fafc 20px)' }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 lg:px-10 mt-auto pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
                {userInitial}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate max-w-[130px]" title={userName}>{userName}</p>
                <p className="text-xs text-primary-foreground/60">Studio Manager</p>
              </div>
            </div>
            <button 
              onClick={() => {
                import('@/lib/firebase').then(({ logout }) => logout());
              }}
              className="p-2 text-primary-foreground/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden z-10 pt-16 lg:pt-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 pt-6 lg:pt-12 pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

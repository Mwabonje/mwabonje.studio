import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, FileText, Receipt, CreditCard, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

export function Layout() {
  const location = useLocation();
  const { clients, projects, invoices } = useStore();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Invoices', href: '/invoices', icon: Receipt, badge: invoices.filter(i => i.status !== 'paid').length > 0 ? invoices.filter(i => i.status !== 'paid').length : undefined },
    { name: 'Performance', href: '/performance', icon: PieChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-primary text-primary-foreground flex flex-col rounded-r-[2.5rem] shadow-2xl z-20 py-8">
        <div className="flex items-center px-10 mb-10">
          <h1 className="text-2xl font-bold tracking-widest text-white">MWABONJE</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name} className="relative pl-8">
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-6 py-4 text-sm font-medium transition-colors relative z-10",
                      isActive 
                        ? "bg-slate-50 text-primary rounded-l-full" 
                        : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground rounded-full mr-8"
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
                    <>
                      <div className="absolute -top-5 right-0 w-5 h-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 0 0, transparent 20px, #f8fafc 20px)' }} />
                      <div className="absolute -bottom-5 right-0 w-5 h-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 0 100%, transparent 20px, #f8fafc 20px)' }} />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-10 mt-auto pt-8">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
              M
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-white">Mwabonje Admin</p>
              <p className="text-xs text-primary-foreground/60">Studio Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        <div className="flex-1 overflow-y-auto px-12 pt-12 pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

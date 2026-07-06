import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/store';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { clients, projects, invoices } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    (c.id && c.id.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    (p.id && p.id.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredInvoices = invoices.filter(i => 
    (i.id && i.id.toLowerCase().includes(query.toLowerCase())) ||
    (i.clientId && clients.find(c => c.id === i.clientId)?.name?.toLowerCase().includes(query.toLowerCase()))
  );

  const hasResults = query.trim().length > 0 && (filteredClients.length > 0 || filteredProjects.length > 0 || filteredInvoices.length > 0);

  const handleSelect = (path: string, id: string) => {
    navigate(`${path}?highlight=${id}`);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors text-sm"
      >
        <div className="flex items-center">
          <Search className="w-4 h-4 mr-2" />
          <span>Search...</span>
        </div>
        <kbd className="hidden lg:inline-flex bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium text-white/90">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 bg-white">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <div className="flex items-center border-b px-4 py-3">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input 
              className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="Search clients, projects, invoices by name or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!query.trim() && (
              <div className="p-8 text-center text-slate-500 text-sm">
                Start typing to search across your workspace...
              </div>
            )}
            
            {query.trim() && !hasResults && (
              <div className="p-8 text-center text-slate-500 text-sm">
                No results found for "{query}"
              </div>
            )}

            {query.trim() && hasResults && (
              <div className="space-y-4">
                {filteredClients.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 px-3 mb-2 uppercase tracking-wider">Clients</h3>
                    <div className="space-y-1">
                      {filteredClients.map(client => (
                        <button 
                          key={client.id}
                          onClick={() => handleSelect('/clients', client.id)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-md flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-800">{client.name}</span>
                          <span className="text-xs text-slate-400">{client.id.substring(0, 8).toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredProjects.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 px-3 mb-2 uppercase tracking-wider">Projects</h3>
                    <div className="space-y-1">
                      {filteredProjects.map(project => (
                        <button 
                          key={project.id}
                          onClick={() => handleSelect('/projects', project.id)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-md flex flex-col"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-slate-800">{project.title}</span>
                            <span className="text-xs text-slate-400">{project.id.substring(0, 8).toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-slate-500">{clients.find(c => c.id === project.clientId)?.name || 'Unknown Client'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredInvoices.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 px-3 mb-2 uppercase tracking-wider">Invoices</h3>
                    <div className="space-y-1">
                      {filteredInvoices.map(invoice => (
                        <button 
                          key={invoice.id}
                          onClick={() => handleSelect('/invoices', invoice.id)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-md flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {invoice.id.startsWith('INV-') ? invoice.id : `INV-${invoice.id.substring(0, 6).toUpperCase()}`}
                            </span>
                            <span className="text-xs text-slate-500">
                              {clients.find(c => c.id === invoice.clientId)?.name || 'Unknown Client'}
                            </span>
                          </div>
                          <span className="font-medium text-slate-800">
                            Ksh {invoice.totalAmount.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

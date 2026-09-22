import React, { useState, useMemo } from 'react';
import { useStore, Feedback, FeedbackStatus, FeedbackType } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Lightbulb, 
  Bug, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  MoreVertical, 
  Filter, 
  Search, 
  ShieldCheck, 
  CheckCheck,
  ChevronDown,
  MessageCircle,
  FileEdit
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; badgeClass: string; icon: React.ElementType }> = {
  new: {
    label: 'New',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    icon: Clock,
  },
  in_review: {
    label: 'In Review',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300',
    icon: Clock,
  },
  planned: {
    label: 'Planned',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
    icon: Sparkles,
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  dismissed: {
    label: 'Dismissed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    icon: CheckCheck,
  },
};

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  feature: {
    label: 'Feature Request',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  bug: {
    label: 'Bug Report',
    icon: Bug,
    color: 'text-rose-600',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  improvement: {
    label: 'Improvement',
    icon: Sparkles,
    color: 'text-sky-600',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  general: {
    label: 'General',
    icon: MessageSquare,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export function SuperUserFeedbackWidget() {
  const { feedbacks, updateFeedback, deleteFeedback } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFeedbackForNotes, setSelectedFeedbackForNotes] = useState<Feedback | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');

  // Counts
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const newCount = feedbacks.filter((f) => f.status === 'new').length;
    const features = feedbacks.filter((f) => f.type === 'feature').length;
    const bugs = feedbacks.filter((f) => f.type === 'bug').length;
    const resolved = feedbacks.filter((f) => f.status === 'resolved').length;
    return { total, newCount, features, bugs, resolved };
  }, [feedbacks]);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchSearch =
        search === '' ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.message.toLowerCase().includes(search.toLowerCase()) ||
        f.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        (f.userName && f.userName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchType = typeFilter === 'all' || f.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [feedbacks, search, statusFilter, typeFilter]);

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    try {
      await updateFeedback(id, { status: newStatus });
      toast.success(`Feedback status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback entry?')) return;
    try {
      await deleteFeedback(id);
      toast.success('Feedback entry deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete feedback');
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedFeedbackForNotes) return;
    try {
      await updateFeedback(selectedFeedbackForNotes.id, { adminNotes: adminNoteText });
      toast.success('Admin notes saved');
      setSelectedFeedbackForNotes(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save notes');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Widget Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                Super User Portal
              </span>
              {stats.newCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold animate-pulse">
                  {stats.newCount} New
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              System Feedback & Feature Ideas
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time user feedback, reported issues, and feature requests submitted across CaptureCRM.
            </p>
          </div>

          {/* Metric Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center shrink-0">
              <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Total</p>
              <p className="text-base font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center shrink-0">
              <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Features</p>
              <p className="text-base font-bold text-amber-200">{stats.features}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center shrink-0">
              <p className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">Bugs</p>
              <p className="text-base font-bold text-rose-200">{stats.bugs}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center shrink-0">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Resolved</p>
              <p className="text-base font-bold text-emerald-200">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search feedback by keyword, user, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] rounded-xl bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New ({stats.newCount})</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs w-[140px] rounded-xl bg-white border-slate-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="feature">Features ({stats.features})</SelectItem>
              <SelectItem value="bug">Bug Reports ({stats.bugs})</SelectItem>
              <SelectItem value="improvement">Improvements</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="divide-y divide-slate-100">
        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Feedback Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {feedbacks.length === 0
                ? "You're all caught up! When team members or other users submit feature ideas or issue reports, they will appear here instantly."
                : 'No feedback matches the selected filters. Try clearing your search.'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => {
            const typeInfo = TYPE_CONFIG[fb.type] || TYPE_CONFIG.general;
            const statusInfo = STATUS_CONFIG[fb.status] || STATUS_CONFIG.new;
            const TypeIcon = typeInfo.icon;
            const StatusIcon = statusInfo.icon;

            const timeDistance = fb.createdAt
              ? formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })
              : 'Recently';
            const formattedDate = fb.createdAt
              ? format(new Date(fb.createdAt), 'MMM d, yyyy h:mm a')
              : '';

            return (
              <div key={fb.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Column: Icon + Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5 border', typeInfo.bg)}>
                      <TypeIcon className={cn('w-4 h-4', typeInfo.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Badges & Meta */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', typeInfo.bg)}>
                          {typeInfo.label}
                        </span>
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1', statusInfo.badgeClass)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                        <span className="text-[11px] text-slate-400" title={formattedDate}>
                          {timeDistance}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {fb.title}
                      </h4>

                      {/* Message Content */}
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        {fb.message}
                      </p>

                      {/* Admin Notes if any */}
                      {fb.adminNotes && (
                        <div className="mt-2 text-xs bg-amber-50/60 border border-amber-200/70 p-2.5 rounded-xl text-amber-950 flex items-start gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-800">Super Admin Note: </span>
                            <span>{fb.adminNotes}</span>
                          </div>
                        </div>
                      )}

                      {/* Sender Info */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{fb.userName || 'Anonymous'}</span>
                        <span>•</span>
                        <span className="text-slate-400">{fb.userEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-slate-200">
                            <span>Status</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleStatusChange(fb.id, 'new')}>
                          <Clock className="w-3.5 h-3.5 mr-2 text-amber-600" />
                          Mark New
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(fb.id, 'in_review')}>
                          <Clock className="w-3.5 h-3.5 mr-2 text-sky-600" />
                          Mark In Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(fb.id, 'planned')}>
                          <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-600" />
                          Mark Planned
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(fb.id, 'resolved')}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(fb.id, 'dismissed')}>
                          <CheckCheck className="w-3.5 h-3.5 mr-2 text-slate-500" />
                          Dismiss
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="Add Admin Note"
                      onClick={() => {
                        setSelectedFeedbackForNotes(fb);
                        setAdminNoteText(fb.adminNotes || '');
                      }}
                    >
                      <FileEdit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete Feedback"
                      onClick={() => handleDelete(fb.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Notes Dialog */}
      <Dialog open={!!selectedFeedbackForNotes} onOpenChange={(open) => !open && setSelectedFeedbackForNotes(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Admin Resolution Note</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs text-slate-500">
              Add internal commentary or resolution details for &quot;{selectedFeedbackForNotes?.title}&quot;.
            </p>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Notes / Action Plan</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Scheduled for Q4 release; merged fix in release v2.4"
                value={adminNoteText}
                onChange={(e) => setAdminNoteText(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedFeedbackForNotes(null)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAdminNotes} className="rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800">
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

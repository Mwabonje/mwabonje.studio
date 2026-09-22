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
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { isSuperUser } from '@/lib/auth-utils';
import { auth } from '@/lib/firebase';
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
  Search, 
  ShieldCheck, 
  CheckCheck,
  ChevronDown,
  MessageCircle,
  FileEdit,
  Plus,
  Star,
  Inbox
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

export function FeedbackInbox() {
  const { feedbacks, updateFeedback, deleteFeedback } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFeedbackForNotes, setSelectedFeedbackForNotes] = useState<Feedback | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const currentUser = auth.currentUser;
  const isSuper = isSuperUser(currentUser?.email);

  // Statistics
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
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this feedback entry?')) return;
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
      toast.success('Admin notes saved successfully');
      setSelectedFeedbackForNotes(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save notes');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              {isSuper ? 'Super User Portal' : 'User Feedback'}
            </span>
            {stats.newCount > 0 && isSuper && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold">
                {stats.newCount} New
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Feedback Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isSuper
              ? 'Review suggestions, feature ideas, and issue reports submitted across CaptureCRM.'
              : 'Submit suggestions, feature ideas, or report any issues directly to the studio administrator.'}
          </p>
        </div>

        <Button
          onClick={() => setIsSubmitDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold px-4 h-10 gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit Feedback
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <Inbox className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">All time submissions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Features</span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.features}</p>
          <p className="text-[11px] text-slate-400 mt-1">Feature proposals</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bugs</span>
            <Bug className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.bugs}</p>
          <p className="text-[11px] text-slate-400 mt-1">Reported issues</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.resolved}</p>
          <p className="text-[11px] text-slate-400 mt-1">Addressed items</p>
        </div>
      </div>

      {/* Main Feedback List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
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

        {/* Feedback Items List */}
        <div className="divide-y divide-slate-100">
          {filteredFeedbacks.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Feedback Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {feedbacks.length === 0
                  ? 'No feedback entries have been submitted yet. Any ideas or bug reports submitted by team members will appear right here.'
                  : 'No feedback matches your search criteria. Try resetting your search or filters.'}
              </p>
              {feedbacks.length === 0 && (
                <Button
                  onClick={() => setIsSubmitDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Submission
                </Button>
              )}
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
                <div key={fb.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Content Section */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5 border', typeInfo.bg)}>
                        <TypeIcon className={cn('w-4 h-4', typeInfo.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badges & Meta */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full border', typeInfo.bg)}>
                            {typeInfo.label}
                          </span>
                          <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1', statusInfo.badgeClass)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                          {fb.rating && (
                            <span className="flex items-center text-[11px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-amber-400 mr-1" />
                              {fb.rating}/5
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400" title={formattedDate}>
                            {timeDistance}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {fb.title}
                        </h3>

                        {/* Message Description */}
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          {fb.message}
                        </p>

                        {/* Admin Notes */}
                        {fb.adminNotes && (
                          <div className="mt-2.5 text-xs bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-amber-950 flex items-start gap-2.5">
                            <MessageCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-900">Admin Resolution Note: </span>
                              <span>{fb.adminNotes}</span>
                            </div>
                          </div>
                        )}

                        {/* Submitter Details */}
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{fb.userName || 'Anonymous'}</span>
                          <span>•</span>
                          <span className="text-slate-400">{fb.userEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    {isSuper && (
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
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
                          title="Add/Edit Admin Note"
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
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
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

      {/* Submit Feedback Dialog */}
      <FeedbackDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen} />
    </div>
  );
}

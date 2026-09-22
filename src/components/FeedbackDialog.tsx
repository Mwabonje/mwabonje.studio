import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore, Feedback, FeedbackType } from '@/store';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Lightbulb, Bug, Sparkles, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const CATEGORIES: {
  type: FeedbackType;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
}[] = [
  {
    type: 'feature',
    label: 'Feature Request',
    desc: 'Suggest a new tool or capability',
    icon: Lightbulb,
    color: 'text-amber-500',
    activeBg: 'border-amber-500 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20',
  },
  {
    type: 'bug',
    label: 'Report Issue',
    desc: 'Something is broken or not working',
    icon: Bug,
    color: 'text-rose-500',
    activeBg: 'border-rose-500 bg-rose-50/70 text-rose-950 dark:bg-rose-950/20',
  },
  {
    type: 'improvement',
    label: 'Improvement',
    desc: 'Tweak an existing workflow or speed',
    icon: Sparkles,
    color: 'text-sky-500',
    activeBg: 'border-sky-500 bg-sky-50/70 text-sky-950 dark:bg-sky-950/20',
  },
  {
    type: 'general',
    label: 'General Feedback',
    desc: 'Thoughts, praise, or questions',
    icon: MessageSquare,
    color: 'text-emerald-500',
    activeBg: 'border-emerald-500 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/20',
  },
];

export function FeedbackDialog({ open, onOpenChange, trigger }: FeedbackDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const { addFeedback } = useStore();
  const [type, setType] = useState<FeedbackType>('feature');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || 'user@capturecrm.com';
  const userName = currentUser?.displayName || userEmail.split('@')[0] || 'Studio Member';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please describe your feedback or idea.');
      return;
    }

    try {
      setIsSubmitting(true);
      const derivedTitle = message.trim().split('\n')[0].slice(0, 80);
      const newFeedback: Feedback = {
        id: crypto.randomUUID(),
        userId: currentUser?.uid || 'anonymous',
        userEmail,
        userName,
        type,
        title: derivedTitle,
        message: message.trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
        rating,
      };

      await addFeedback(newFeedback);
      toast.success('Feedback sent! The Super Admin has received your submission.', {
        description: 'Thank you for helping us make CaptureCRM better.',
        duration: 4000,
      });

      setMessage('');
      setType('feature');
      setRating(5);
      setOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to send feedback. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200">
        <div className="bg-slate-900 text-white p-6 rounded-t-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium text-slate-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Direct to Super Admin
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              System Feedback & Ideas
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 mt-1">
              Have an idea, request a feature, or report a bug? Your feedback is sent directly to the Super User dashboard.
            </DialogDescription>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category Selector */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
              What kind of feedback is this?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = type === cat.type;
                return (
                  <button
                    type="button"
                    key={cat.type}
                    onClick={() => setType(cat.type)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1',
                      isSelected
                        ? cat.activeBg + ' shadow-sm ring-1 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Icon className={cn('w-4 h-4', isSelected ? 'text-current' : cat.color)} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[11px] opacity-75 line-clamp-1">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details / Message */}
          <div>
            <Label htmlFor="feedback-message" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Details & Context <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="feedback-message"
              placeholder={
                type === 'feature'
                  ? "Describe the feature or capability you'd like to see..."
                  : type === 'bug'
                  ? "Describe what happened, what wasn't working, or steps to reproduce..."
                  : type === 'improvement'
                  ? "Describe what workflow or action could be improved or made faster..."
                  : "Share your thoughts, suggestions, or questions..."
              }
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-sm rounded-xl resize-none"
              required
            />
          </div>

          {/* User info stamp */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800">{userName}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-500 truncate">{userEmail}</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">
              Verified Sender
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs h-10 px-4"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-10 px-5 gap-2 font-semibold shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Sending...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

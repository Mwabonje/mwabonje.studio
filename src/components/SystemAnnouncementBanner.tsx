import React, { useState } from 'react';
import { useStore } from '@/store';
import { Megaphone, AlertTriangle, Info, X } from 'lucide-react';

export function SystemAnnouncementBanner() {
  const announcements = useStore((state) => state.announcements);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem('dismissed_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const activeAnnouncement = announcements.find((a) => {
    if (!a.isActive) return false;
    if (dismissedIds.includes(a.id)) return false;
    if (a.expiresAt) {
      const now = new Date().toISOString().split('T')[0];
      if (a.expiresAt < now) return false;
    }
    return true;
  });

  if (!activeAnnouncement) return null;

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('dismissed_announcements', JSON.stringify(updated));
    } catch {}
  };

  const isWarning = activeAnnouncement.type === 'warning';
  const isInfo = activeAnnouncement.type === 'info';

  const bgClass = isWarning
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
    : isInfo
    ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
    : 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200';

  const Icon = isWarning ? AlertTriangle : isInfo ? Info : Megaphone;

  return (
    <div className={`w-full px-4 py-2.5 border-b text-xs flex items-center justify-between gap-3 transition-colors ${bgClass}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 shrink-0" />
        <div className="truncate">
          <strong className="font-semibold mr-1.5">{activeAnnouncement.title}:</strong>
          <span className="opacity-90">{activeAnnouncement.message}</span>
        </div>
      </div>
      <button
        onClick={() => handleDismiss(activeAnnouncement.id)}
        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 shrink-0 transition-colors"
        title="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

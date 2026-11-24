import React, { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Activity, ArrowRight, Clock, Eye, Users } from 'lucide-react';
import { AuditLog, SystemUser, UserRole } from '@/store';
import { Button } from '@/components/ui/button';

type ActiveWindow = '30d' | '7d' | '24h' | '5m';

interface UserActivitySummaryProps {
  users: SystemUser[];
  auditLogs?: AuditLog[];
  currentUserEmail?: string | null;
  onInspectUser?: (user: SystemUser) => void;
  onViewAllUsers?: () => void;
}

const WINDOW_CONFIG: Record<ActiveWindow, { label: string; shortLabel: string; ms: number }> = {
  '30d': { label: 'Active (30 Days)', shortLabel: '30 Days', ms: 30 * 24 * 60 * 60 * 1000 },
  '7d': { label: 'Active (7 Days)', shortLabel: '7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
  '24h': { label: 'Active (24 Hours)', shortLabel: 'Today', ms: 24 * 60 * 60 * 1000 },
  '5m': { label: 'Live Now (5 Mins)', shortLabel: 'Live', ms: 5 * 60 * 1000 },
};

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  studio_admin: 'Studio Admin',
  photographer: 'Lead Photographer',
  viewer: 'Assistant / Viewer',
};

function getActivityTier(lastActiveAt: string, nowMs: number) {
  const activeMs = new Date(lastActiveAt).getTime();
  const diffMs = Math.max(0, nowMs - activeMs);

  if (diffMs <= 5 * 60 * 1000) {
    return {
      statusLabel: 'Active',
      tierLabel: 'Live Now',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      pulse: true,
    };
  }
  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      statusLabel: 'Active',
      tierLabel: 'Today',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      pulse: false,
    };
  }
  if (diffMs <= 7 * 24 * 60 * 60 * 1000) {
    return {
      statusLabel: 'Active',
      tierLabel: 'This Week',
      badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      dotClass: 'bg-blue-500',
      pulse: false,
    };
  }
  return {
    statusLabel: 'Active',
    tierLabel: 'This Month',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    dotClass: 'bg-sky-500',
    pulse: false,
  };
}

export function UserActivitySummary({
  users,
  auditLogs = [],
  currentUserEmail,
  onInspectUser,
  onViewAllUsers,
}: UserActivitySummaryProps) {
  const [windowFilter, setWindowFilter] = useState<ActiveWindow>('30d');

  const activeUsers = useMemo(() => {
    const nowMs = Date.now();
    const cutoffMs = nowMs - WINDOW_CONFIG[windowFilter].ms;

    return users
      .filter((user) => {
        if (user.status === 'suspended') return false;
        if (!user.lastActiveAt) return false;
        const ts = new Date(user.lastActiveAt).getTime();
        return !Number.isNaN(ts) && ts >= cutoffMs;
      })
      .sort((a, b) => {
        const aMs = new Date(a.lastActiveAt!).getTime();
        const bMs = new Date(b.lastActiveAt!).getTime();
        return bMs - aMs;
      });
  }, [users, windowFilter]);

  const nowMs = Date.now();

  return (
    <section
      aria-label="User Activity Summary"
      className="border border-border rounded-2xl p-6 bg-card shadow-sm space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>User Activity Summary</span>
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              {activeUsers.length} Active
            </span>
            <span className="text-xs text-muted-foreground">
              of {users.length} registered
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Users marked <strong className="text-foreground">Active</strong> based on their most recent{' '}
            <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-muted">lastActiveAt</code> timestamp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Activity Window Selector */}
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border">
            {(Object.keys(WINDOW_CONFIG) as ActiveWindow[]).map((key) => {
              const selected = windowFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWindowFilter(key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    selected
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {WINDOW_CONFIG[key].shortLabel}
                </button>
              );
            })}
          </div>

          {onViewAllUsers && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllUsers}
              className="h-8 text-xs font-medium"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Users List */}
      {activeUsers.length === 0 ? (
        <div className="py-10 px-4 text-center border border-dashed border-border rounded-xl bg-muted/20">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">
            No active users recorded in this window
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No users have a <code className="font-mono">lastActiveAt</code> timestamp within the{' '}
            {WINDOW_CONFIG[windowFilter].label.toLowerCase()} range.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {activeUsers.map((user) => {
            const tier = getActivityTier(user.lastActiveAt!, nowMs);
            const lastActiveDate = new Date(user.lastActiveAt!);
            const isCurrent =
              !!currentUserEmail &&
              user.email.toLowerCase() === currentUserEmail.toLowerCase();
            const actionCount = auditLogs.filter(
              (log) =>
                log.actorId === user.id ||
                log.actorEmail.toLowerCase() === user.email.toLowerCase()
            ).length;

            return (
              <div
                key={user.id}
                className="py-3.5 px-2 -mx-2 rounded-xl hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Identity & Role */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {(user.displayName || user.email).charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${tier.dotClass} ${
                        tier.pulse ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {user.displayName || user.email.split('@')[0]}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          You
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        · {ROLE_LABELS[user.role] || 'Photographer'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Active Status & lastActiveAt Timestamp */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${tier.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${tier.dotClass} ${
                            tier.pulse ? 'animate-pulse' : ''
                          }`}
                        />
                        {tier.statusLabel} · {tier.tierLabel}
                      </span>
                    </div>
                    <div className="flex items-center sm:justify-end gap-1.5 text-[11px] text-muted-foreground font-mono mt-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span title={lastActiveDate.toISOString()}>
                        {formatDistanceToNow(lastActiveDate, { addSuffix: true })} (
                        {format(lastActiveDate, 'MMM d, HH:mm')})
                      </span>
                    </div>
                  </div>

                  {onInspectUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInspectUser(user)}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      title={`Inspect ${actionCount} recorded actions`}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span className="font-mono">{actionCount}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

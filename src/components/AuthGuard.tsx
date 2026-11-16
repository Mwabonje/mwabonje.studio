import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import { isSuperUser } from '../lib/auth-utils';
import { Button } from '@/components/ui/button';

export const AuthGuard: React.FC = () => {
  const isAuthReady = useStore((state) => state.isAuthReady);
  const userId = useStore((state) => state.userId);
  const systemUsers = useStore((state) => state.systemUsers);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const currentUser = auth.currentUser;
  const isSuper = isSuperUser(currentUser?.email);
  const myRecord = systemUsers.find((u) => u.id === userId || (currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()));

  // If a non-super user has been suspended by the administrator, block system access
  if (!isSuper && myRecord && myRecord.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md w-full p-8 border border-border bg-card rounded-2xl shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Studio Account Suspended</h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Your access to this studio management platform has been temporarily placed on hold by the Super Administrator.
            </p>
          </div>
          <div className="p-3 bg-muted/60 rounded-xl border border-border text-xs text-muted-foreground font-mono">
            User: {currentUser?.email}
          </div>
          <p className="text-xs text-muted-foreground">
            Please reach out to Michael Ringa (<a href="mailto:ringa.michael@gmail.com" className="text-primary underline">ringa.michael@gmail.com</a>) to reactivate your studio privileges.
          </p>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full gap-2 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC = () => {
  const isAuthReady = useStore((state) => state.isAuthReady);
  const userId = useStore((state) => state.userId);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

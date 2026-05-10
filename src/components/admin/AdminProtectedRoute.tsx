import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

const AdminProtectedRoute = () => {
  const { admin, isAdminLoading } = useAdminAuth();

  if (isAdminLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0f172a] text-white">
        <Loader2 className="h-12 w-12 animate-spin text-[#006600] mb-4" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;

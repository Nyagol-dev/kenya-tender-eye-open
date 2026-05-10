
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Import AuthProvider and useAuth

import Index from "./pages/Index";
import TendersPage from "./pages/TendersPage";
import TenderDetailPage from "./pages/TenderDetailPage";
import SuppliersPage from "./pages/SuppliersPage";
import AboutPage from "./pages/AboutPage";
import DocumentationPage from "./pages/DocumentationPage";
import AuthPage from "./pages/AuthPage"; // Import AuthPage
import ProfilePage from "./pages/ProfilePage"; // Import ProfilePage
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import NotFound from "./pages/NotFound";
import SupplierOnboardingPage from "./pages/SupplierOnboardingPage";

// Placeholder for Admin Dashboard
const AdminDashboardPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
    <p className="text-muted-foreground">Welcome to the e-Procurement Administration portal.</p>
  </div>
);

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loadingInitial } = useAuth();
  
  if (loadingInitial) return null; // or a loading spinner
  
  if (!profile?.is_admin) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const SupplierProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loadingInitial, loadingProfile, onboardingStatus } = useAuth();
  
  if (loadingInitial || loadingProfile) return null; // or a loading spinner
  
  if (profile?.user_type === 'supplier' && onboardingStatus !== 'approved') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter> {/* BrowserRouter now wraps AuthProvider */}
        <AuthProvider> {/* AuthProvider is now a child of BrowserRouter */}
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<SupplierOnboardingPage />} />
            <Route path="/" element={<SupplierProtectedRoute><Index /></SupplierProtectedRoute>} />
            <Route path="/profile" element={<SupplierProtectedRoute><ProfilePage /></SupplierProtectedRoute>} />
            <Route path="/tenders" element={<SupplierProtectedRoute><TendersPage /></SupplierProtectedRoute>} />
            <Route path="/tenders/:id" element={<SupplierProtectedRoute><TenderDetailPage /></SupplierProtectedRoute>} />
            <Route path="/suppliers" element={<SupplierProtectedRoute><SuppliersPage /></SupplierProtectedRoute>} />
            <Route path="/about" element={<SupplierProtectedRoute><AboutPage /></SupplierProtectedRoute>} />
            <Route path="/documentation" element={<SupplierProtectedRoute><DocumentationPage /></SupplierProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <AdminAuthProvider>
                <AdminProtectedRoute />
              </AdminAuthProvider>
            }>
              <Route path="dashboard" element={<AdminDashboardPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import Index from "./pages/Index";
import TendersPage from "./pages/TendersPage";
import TenderDetailPage from "./pages/TenderDetailPage";
import SuppliersPage from "./pages/SuppliersPage";
import AboutPage from "./pages/AboutPage";
import DocumentationPage from "./pages/DocumentationPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import NotFound from "./pages/NotFound";
import SupplierOnboardingPage from "./pages/SupplierOnboardingPage";
import GovernmentEntityPortalPage from "./pages/GovernmentEntityPortalPage";

import { AdminDashboardPage } from "./pages/AdminDashboardPage";

const queryClient = new QueryClient();

const SupplierProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loadingInitial, loadingProfile, onboardingStatus } = useAuth();
  
  if (loadingInitial || loadingProfile) return null;
  
  if (profile?.user_type === 'supplier' && (onboardingStatus === 'pending' || onboardingStatus === 'expired' || onboardingStatus === 'rejected')) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

// Route only accessible to government_entity users
const GovEntityRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loadingInitial } = useAuth();
  if (loadingInitial) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile && profile.user_type !== 'government_entity') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
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
              {/* Government entity portal */}
              <Route
                path="/entity-portal"
                element={<GovEntityRoute><GovernmentEntityPortalPage /></GovEntityRoute>}
              />
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminProtectedRoute />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

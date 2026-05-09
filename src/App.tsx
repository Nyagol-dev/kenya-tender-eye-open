
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
import AdminApprovalsPage from "./pages/AdminApprovalsPage"; // Import AdminApprovalsPage
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loadingInitial } = useAuth();
  
  if (loadingInitial) return null; // or a loading spinner
  
  if (!profile?.is_admin) {
    return <Navigate to="/" />;
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tenders" element={<TendersPage />} />
            <Route path="/tenders/:id" element={<TenderDetailPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/admin/approvals" element={
              <AdminRoute>
                <AdminApprovalsPage />
              </AdminRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

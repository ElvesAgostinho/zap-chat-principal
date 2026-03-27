import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import DeliveryPanel from "./pages/DeliveryPanel";
import ChatPanel from "./pages/ChatPanel";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import SignupPage from "./pages/SignupPage";
import CatalogPage from "./pages/CatalogPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import PendingApprovalScreen from "./components/PendingApprovalScreen";
import SuspendedScreen from "./components/SuspendedScreen";
import DeletedAccountScreen from "./components/DeletedAccountScreen";
import CookieConsent from "./components/CookieConsent";
import FloatingSupportBot from "./components/FloatingSupportBot";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }: { children: React.ReactNode; adminOnly?: boolean; superAdminOnly?: boolean }) {
  const { user, role, loading, isSuperAdmin, statusLoja, isExpired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/" replace />;
  
  // If store account was deleted by admin
  if (!isSuperAdmin && statusLoja === 'eliminado') {
    return <DeletedAccountScreen />;
  }

  // If store is pending approval
  if (!isSuperAdmin && statusLoja === 'pendente_aprovacao') {
    return <PendingApprovalScreen />;
  }

  // If store is suspended (manual) or expired (auto-billing)
  if (!isSuperAdmin && (statusLoja === 'suspenso' || isExpired)) {
    return <SuspendedScreen />;
  }

  if (adminOnly && role !== 'admin' && !isSuperAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, role, loading, isSuperAdmin, statusLoja, isExpired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route
        path="/"
        element={
          user ? (
            <ProtectedRoute>
              {isSuperAdmin ? (
                <SuperAdminPanel />
              ) : statusLoja === 'eliminado' ? (
                <DeletedAccountScreen />
              ) : statusLoja === 'pendente_aprovacao' ? (
                <PendingApprovalScreen />
              ) : (statusLoja === 'suspenso' || isExpired) ? (
                <SuspendedScreen />
              ) : (
                <Index />
              )}
            </ProtectedRoute>
          ) : (
            <LandingPage />
          )
        }
      />
      <Route path="/entregas" element={<ProtectedRoute><DeliveryPanel /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPanel /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      <Route path="/super-admin" element={<ProtectedRoute superAdminOnly><SuperAdminPanel /></ProtectedRoute>} />
      <Route path="/loja/:storeSlug" element={<CatalogPage />} />
      <Route path="/catalogo/:storeSlug" element={<CatalogPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const SupportBotWrapper = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Don't show while determining auth state to avoid "flash"
  if (loading) return null;

  // Only show the bot if the user is NOT logged in AND is on a public page
  // This targets "clientes novos" as requested.
  const publicPaths = ["/", "/login", "/signup"];
  const isPublicPage = publicPaths.includes(location.pathname);

  if (!user && isPublicPage) {
    return <FloatingSupportBot />;
  }

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

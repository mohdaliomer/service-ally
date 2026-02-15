import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ComplaintsList from "@/pages/ComplaintsList";
import ComplaintDetail from "@/pages/ComplaintDetail";
import NewComplaint from "@/pages/NewComplaint";
import UserManagement from "@/pages/UserManagement";
import StoreManagement from "@/pages/StoreManagement";
import RegionManagement from "@/pages/RegionManagement";
import DepartmentCategoryManagement from "@/pages/DepartmentCategoryManagement";
import Login from "@/pages/Login";
import Setup from "@/pages/Setup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/setup" element={user ? <Navigate to="/" replace /> : <Setup />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><AppLayout><ComplaintsList /></AppLayout></ProtectedRoute>} />
      <Route path="/requests/new" element={<ProtectedRoute><AppLayout><NewComplaint /></AppLayout></ProtectedRoute>} />
      <Route path="/requests/:id" element={<ProtectedRoute><AppLayout><ComplaintDetail /></AppLayout></ProtectedRoute>} />
      {/* Legacy routes redirect */}
      <Route path="/complaints" element={<Navigate to="/requests" replace />} />
      <Route path="/complaints/new" element={<Navigate to="/requests/new" replace />} />
      <Route path="/complaints/:id" element={<Navigate to="/requests/:id" replace />} />
      <Route path="/users" element={<ProtectedRoute><AppLayout><UserManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/stores" element={<ProtectedRoute><AppLayout><StoreManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/regions" element={<ProtectedRoute><AppLayout><RegionManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/config" element={<ProtectedRoute><AppLayout><DepartmentCategoryManagement /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

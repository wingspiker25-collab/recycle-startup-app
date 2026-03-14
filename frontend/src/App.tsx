import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import InviteSignup from "./pages/InviteSignup";
import Home from "./pages/Home";
import NewPickup from "./pages/NewPickup";
import PickupDetail from "./pages/PickupDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserHistory from "./pages/AdminUserHistory";

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== "admin" && user.role !== "driver") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (user) {
    if (user.role === "admin" || user.role === "driver") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/invite/:token" element={<InviteSignup />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/new-pickup" element={<ProtectedRoute><NewPickup /></ProtectedRoute>} />
      <Route path="/pickup/:id" element={<ProtectedRoute><PickupDetail /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute requireAdmin><AdminUserHistory /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

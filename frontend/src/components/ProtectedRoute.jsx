import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a page with <ProtectedRoute roles={["host"]}> ... </ProtectedRoute>
const ProtectedRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;

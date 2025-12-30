import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactElement;
}

export const AuthGuard = ({ children }: Props) => {
  // Simple client-side guard: check for token in localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthGuard;

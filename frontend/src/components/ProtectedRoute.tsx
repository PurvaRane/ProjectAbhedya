import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  actorType: "customer" | "employee";
}

export default function ProtectedRoute({ children, actorType }: ProtectedRouteProps) {
  const { isAuthenticated, actorType: currentActor } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={actorType === "customer" ? "/customer/login" : "/employee/login"} replace />;
  }

  if (currentActor !== actorType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

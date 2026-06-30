import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { apiClient } from "../api/client";

interface AuthState {
  role: string | null;
  actorType: "customer" | "employee" | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (tokens: {
    role: string;
    actor_type: "customer" | "employee";
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadAuthState(): AuthState {
  return {
    role: localStorage.getItem("role"),
    actorType: (localStorage.getItem("actor_type") as AuthState["actorType"]) || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuthState);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.role && auth.actorType),
      login: (tokens) => {
        localStorage.setItem("role", tokens.role);
        localStorage.setItem("actor_type", tokens.actor_type);
        setAuth({
          role: tokens.role,
          actorType: tokens.actor_type,
        });
      },
      logout: () => {
        if (auth.actorType === "employee") {
          apiClient.post("/auth/employee/logout").catch(() => {});
        } else if (auth.actorType === "customer") {
          apiClient.post("/auth/customer/logout").catch(() => {});
        }
        
        localStorage.removeItem("role");
        localStorage.removeItem("actor_type");
        setAuth({
          role: null,
          actorType: null,
        });
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

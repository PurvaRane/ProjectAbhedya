import { createContext, useContext, useMemo, useState, ReactNode } from "react";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  actorType: "customer" | "employee" | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (tokens: {
    access_token: string;
    refresh_token: string;
    role: string;
    actor_type: "customer" | "employee";
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadAuthState(): AuthState {
  return {
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    role: localStorage.getItem("role"),
    actorType: (localStorage.getItem("actor_type") as AuthState["actorType"]) || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuthState);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.accessToken),
      login: (tokens) => {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        localStorage.setItem("role", tokens.role);
        localStorage.setItem("actor_type", tokens.actor_type);
        setAuth({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          role: tokens.role,
          actorType: tokens.actor_type,
        });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("role");
        localStorage.removeItem("actor_type");
        setAuth({
          accessToken: null,
          refreshToken: null,
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

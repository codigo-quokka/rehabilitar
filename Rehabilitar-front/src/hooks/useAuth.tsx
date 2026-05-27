import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthState, Role } from "../types";
import { authApi } from "../api";
import { jwtDecode } from "jwt-decode";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  isLoading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 🔴 BYPASS MODE (para poder inyectar user desde LocalStorage manualmente)
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  // 🟢 Hidratación desde LocalStorage (esto permite el bypass)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp > currentTime) {
          setState({
            token,
            user: JSON.parse(userStr),
            isAuthenticated: true,
          });
        } else {
          // Token expirado
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        // Error al decodificar
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // 🔵 Sincroniza cambios del state hacia LocalStorage
  useEffect(() => {
    if (state.token && state.user) {
      localStorage.setItem("token", state.token);
      localStorage.setItem("user", JSON.stringify(state.user));
    }
  }, [state.token, state.user]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setState({
      token: response.token,
      user: response.user,
      isAuthenticated: true,
    });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      setState({ token: null, user: null, isAuthenticated: false });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const hasRole = (roles: Role[]) => {
    if (!state.user) return false;
    return roles.includes(state.user.rol);
  };

  const updateUser = (user: User) => {
    setState(prev => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, hasRole, isLoading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

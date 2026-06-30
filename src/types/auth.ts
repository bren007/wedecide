import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  is_global_admin: boolean;
  roles: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isChair: boolean;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface User {
  id: string; // Unique Supabase Auth user ID (UUID)
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (isRecovery: boolean) => void;
  clearError: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

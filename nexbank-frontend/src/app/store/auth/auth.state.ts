/**
 * Authenticated user profile returned from the API.
 */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  isFrozen: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

/**
 * Auth slice state shape for NgRx store.
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpEmail: string | null;
}

/**
 * Initial state for the auth slice.
 */
export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  otpEmail: null,
};

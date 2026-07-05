import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

/**
 * Auth reducer — manages authentication state transitions.
 */
export const authReducer = createReducer(
  initialAuthState,

  // Register
  on(AuthActions.register, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.registerSuccess, (state, { email, message }) => ({
    ...state,
    isLoading: false,
    otpEmail: email,
    error: null,
  })),
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Verify OTP
  on(AuthActions.verifyOtp, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.verifyOtpSuccess, (state, { user, accessToken }) => ({
    ...state,
    isLoading: false,
    user,
    accessToken,
    isAuthenticated: true,
    otpEmail: null,
    error: null,
  })),
  on(AuthActions.verifyOtpFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { user, accessToken }) => ({
    ...state,
    isLoading: false,
    user,
    accessToken,
    isAuthenticated: true,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Refresh token
  on(AuthActions.refreshToken, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(AuthActions.refreshTokenSuccess, (state, { accessToken, user }) => ({
    ...state,
    isLoading: false,
    accessToken,
    user,
    isAuthenticated: true,
    error: null,
  })),
  on(AuthActions.refreshTokenFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    error,
  })),

  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
  })),
  on(AuthActions.logoutFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Hydrate from localStorage
  on(AuthActions.loadUserFromStorageSuccess, (state, { user, accessToken }) => ({
    ...state,
    user,
    accessToken,
    isAuthenticated: true,
  })),

  // Utility
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
  on(AuthActions.clearOtpEmail, (state) => ({
    ...state,
    otpEmail: null,
  })),
);

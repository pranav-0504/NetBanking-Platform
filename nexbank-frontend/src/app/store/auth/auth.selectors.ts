import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

/** Feature key for the auth slice in the NgRx store. */
export const AUTH_FEATURE_KEY = 'auth';

/** Selects the entire auth feature state. */
export const selectAuthState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);

/** Selects the current authenticated user. */
export const selectUser = createSelector(selectAuthState, (state) => state.user);

/** Selects whether the user is authenticated. */
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated,
);

/** Selects the JWT access token. */
export const selectAccessToken = createSelector(
  selectAuthState,
  (state) => state.accessToken,
);

/** Selects the auth loading flag. */
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.isLoading);

/** Selects the auth error message. */
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

/** Selects the email pending OTP verification. */
export const selectOtpEmail = createSelector(selectAuthState, (state) => state.otpEmail);

/** Selects the user's role. */
export const selectUserRole = createSelector(selectUser, (user) => user?.role ?? null);

/** Returns true if the current user is an admin. */
export const selectIsAdmin = createSelector(selectUserRole, (role) => role === 'admin');

/** Returns true if the current user is a customer. */
export const selectIsCustomer = createSelector(selectUserRole, (role) => role === 'customer');

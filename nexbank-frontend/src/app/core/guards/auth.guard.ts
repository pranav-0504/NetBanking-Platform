import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = getStoredValue(ACCESS_TOKEN_KEY);

  if (token && !isTokenExpired(token)) {
    syncRememberedSession();
    return true;
  }

  const refreshToken = getStoredValue(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    clearAuthStorage();
    return router.createUrlTree(['/auth/login']);
  }

  return authService.refreshSession(refreshToken).pipe(
    map((response) => {
      persistRefreshedSession(response);
      return true;
    }),
    catchError(() => {
      clearAuthStorage();
      return of(router.createUrlTree(['/auth/login']));
    }),
  );
};

const getStoredValue = (key: string) => sessionStorage.getItem(key) || localStorage.getItem(key);

const shouldPersistToLocalStorage = () => !!localStorage.getItem(REFRESH_TOKEN_KEY);

const persistValue = (key: string, value: string | null | undefined) => {
  if (!value) {
    return;
  }

  sessionStorage.setItem(key, value);

  if (shouldPersistToLocalStorage()) {
    localStorage.setItem(key, value);
  }
};

const persistRefreshedSession = (response: any) => {
  persistValue(ACCESS_TOKEN_KEY, response?.data?.accessToken || response?.accessToken);
  persistValue(REFRESH_TOKEN_KEY, response?.data?.refreshToken || response?.refreshToken);

  if (response?.data?.user) {
    persistValue(USER_KEY, JSON.stringify(response.data.user));
  }

  if (response?.data?.account) {
    persistValue(ACCOUNT_KEY, JSON.stringify(response.data.account));
  }
};

const syncRememberedSession = () => {
  [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ACCOUNT_KEY].forEach((key) => {
    const storedValue = localStorage.getItem(key);

    if (storedValue && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, storedValue);
    }
  });
};

const clearAuthStorage = () => {
  [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ACCOUNT_KEY].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload?.exp;

    if (!expiry) {
      return false;
    }

    return Date.now() >= expiry * 1000;
  } catch {
    return true;
  }
};

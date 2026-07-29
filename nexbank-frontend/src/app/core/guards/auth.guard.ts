import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';
const SESSION_EXPIRY_KEY = 'nexbank_session_expires_at';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);

  if (!sessionService.isSessionActive()) {
    sessionService.endSession(false);
    return router.createUrlTree(['/auth/login']);
  }
  const token = getStoredValue(ACCESS_TOKEN_KEY);

  if (token && !isTokenExpired(token)) {
    syncRememberedSession();
    return true;
  }

  const refreshToken = getStoredValue(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    sessionService.endSession(false);
    return router.createUrlTree(['/auth/login']);
  }

  return authService.refreshSession(refreshToken).pipe(
    map((response) => {
      sessionService.persistRefreshedSession(response);
      return true;
    }),
    catchError(() => {
      sessionService.endSession(false);
      return of(router.createUrlTree(['/auth/login']));
    }),
  );
};

const getStoredValue = (key: string) => sessionStorage.getItem(key) || localStorage.getItem(key);

const syncRememberedSession = () => {
  [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ACCOUNT_KEY, SESSION_EXPIRY_KEY].forEach((key) => {
    const storedValue = localStorage.getItem(key);

    if (storedValue && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, storedValue);
    }
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

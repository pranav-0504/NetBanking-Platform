import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const token = getStoredValue(ACCESS_TOKEN_KEY);
  const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));

  const authReq =
    token && !isAuthRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((error) => {
      const refreshToken = getStoredValue(REFRESH_TOKEN_KEY);

      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthRequest || !refreshToken) {
        return throwError(() => error);
      }

      return http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
        switchMap((response) => {
          persistRefreshedSession(response);
          const nextAccessToken = getStoredValue(ACCESS_TOKEN_KEY);

          const retryReq = nextAccessToken
            ? req.clone({
                setHeaders: {
                  Authorization: `Bearer ${nextAccessToken}`,
                },
              })
            : req;

          return next(retryReq);
        }),
        catchError((refreshError) => {
          clearAuthStorage();
          router.navigateByUrl('/auth/login');
          return throwError(() => refreshError);
        }),
      );
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

const clearAuthStorage = () => {
  [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ACCOUNT_KEY].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

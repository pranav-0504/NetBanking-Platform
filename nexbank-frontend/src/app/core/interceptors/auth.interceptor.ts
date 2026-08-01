import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { SessionService } from '../services/session.service';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
const NO_REFRESH_ENDPOINTS = ['/auth/change-password'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const sessionService = inject(SessionService);
  const token = getStoredValue(ACCESS_TOKEN_KEY);
  const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));
  const shouldSkipRefresh = NO_REFRESH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));

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

      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthRequest || shouldSkipRefresh || !refreshToken) {
        return throwError(() => error);
      }

      if (!sessionService.isSessionActive()) {
        sessionService.endSession();
        return throwError(() => error);
      }

      return http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
        switchMap((response) => {
          sessionService.persistRefreshedSession(response);
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
          sessionService.endSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

const getStoredValue = (key: string) => sessionStorage.getItem(key) || localStorage.getItem(key);

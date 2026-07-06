import { HttpInterceptorFn } from '@angular/common/http';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));

  if (!token || isAuthRequest) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};

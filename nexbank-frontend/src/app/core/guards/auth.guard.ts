import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const USER_KEY = 'nexbank_user';

export const authGuard: CanActivateFn = () => {
  
  const router = inject(Router);
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token || isTokenExpired(token)) {
    
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    return router.createUrlTree(['/auth/login']);         // if token is not present or expired then redirect to login page
  }

  return true;
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

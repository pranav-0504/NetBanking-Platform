import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  try {
    const user = JSON.parse(sessionStorage.getItem('nexbank_user') || localStorage.getItem('nexbank_user') || '{}');
    return user?.role === 'admin' ? true : router.createUrlTree(['/dashboard']);
  } catch { return router.createUrlTree(['/auth/login']); }
};

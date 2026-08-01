import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Reaching the login page ends any existing session. This prevents browser
 * Forward navigation from restoring access to a previously visited protected route.
 */
export const loginRouteGuard: CanActivateFn = () => {
  inject(SessionService).logout(false);
  return true;
};

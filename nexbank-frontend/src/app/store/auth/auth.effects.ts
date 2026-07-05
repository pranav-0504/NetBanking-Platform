import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap, map, filter } from 'rxjs/operators';
import { AuthActions } from './auth.actions';
import { User } from './auth.state';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const USER_KEY = 'nexbank_user';

/**
 * Auth effects — side effects for authentication actions.
 * API calls will be wired in Phase 1 Step 9 when auth service is created.
 */
@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);

  /** Persist auth data to localStorage on successful login/OTP verify. */
  persistAuth$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.verifyOtpSuccess),
        tap(({ accessToken, user }) => {
          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }),
      ),
    { dispatch: false },
  );

  /** Clear localStorage on logout success. */
  clearStorage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }),
      ),
    { dispatch: false },
  );

  /** Hydrate auth state from localStorage on app init. */
  hydrateAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      map(() => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const userJson = localStorage.getItem(USER_KEY);

        if (token && userJson) {
          try {
            const user = JSON.parse(userJson) as User;
            return AuthActions.loadUserFromStorageSuccess({ user, accessToken: token });
          } catch {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        }

        return null;
      }),
      filter((action): action is ReturnType<typeof AuthActions.loadUserFromStorageSuccess> =>
        action !== null,
      ),
    ),
  );
}

export { ACCESS_TOKEN_KEY, USER_KEY };

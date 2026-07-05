import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from './auth.state';

/**
 * Auth action group — all authentication-related actions.
 */
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Register': props<{ fullName: string; email: string; phone: string; password: string }>(),
    'Register Success': props<{ message: string; email: string }>(),
    'Register Failure': props<{ error: string }>(),

    'Verify Otp': props<{ email: string; otp: string }>(),
    'Verify Otp Success': props<{ user: User; accessToken: string }>(),
    'Verify Otp Failure': props<{ error: string }>(),

    'Login': props<{ email: string; password: string }>(),
    'Login Success': props<{ user: User; accessToken: string }>(),
    'Login Failure': props<{ error: string }>(),

    'Refresh Token': emptyProps(),
    'Refresh Token Success': props<{ accessToken: string; user: User }>(),
    'Refresh Token Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Logout Failure': props<{ error: string }>(),

    'Load User From Storage': emptyProps(),
    'Load User From Storage Success': props<{ user: User; accessToken: string }>(),

    'Clear Error': emptyProps(),
    'Clear Otp Email': emptyProps(),
  },
});

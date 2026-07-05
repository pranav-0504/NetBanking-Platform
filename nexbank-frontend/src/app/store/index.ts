import { AUTH_FEATURE_KEY } from './auth/auth.selectors';
import { authReducer } from './auth/auth.reducer';
import { AuthEffects } from './auth/auth.effects';

/**
 * Root NgRx reducers map.
 */
export const reducers = {
  [AUTH_FEATURE_KEY]: authReducer,
};

/**
 * Root NgRx effects array.
 */
export const effects = [AuthEffects];

export { AUTH_FEATURE_KEY } from './auth/auth.selectors';
export { AuthActions } from './auth/auth.actions';
export * from './auth/auth.selectors';
export * from './auth/auth.state';

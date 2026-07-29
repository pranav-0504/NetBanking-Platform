import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';
const SESSION_EXPIRY_KEY = 'nexbank_session_expires_at';
const SESSION_DURATION_MS = 20 * 60 * 1000;
const RENEWAL_THROTTLE_MS = 60 * 1000;
const SESSION_WARNING_MS = 60 * 1000;
const LOGOUT_DELAY_MS = 800;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private expiryTimer?: number;
  private warningTimer?: number;
  private countdownTimer?: number;
  private lastRenewalAt = 0;
  private renewalInProgress = false;
  readonly showTimeoutWarning = signal(false);
  readonly secondsRemaining = signal(60);
  readonly isLoggingOut = signal(false);

  constructor() {
    this.scheduleExpiry();
    ['click', 'keydown', 'scroll', 'touchstart'].forEach((eventName) => {
      document.addEventListener(eventName, () => this.onActivity(), { passive: true });
    });
  }

  startSession() {
    this.setSessionExpiry(Date.now() + SESSION_DURATION_MS);
  }

  continueSession() {
    if (this.renewalInProgress) {
      return;
    }

    this.renewSession();
  }

  logout() {
    const refreshToken = this.getStoredValue(REFRESH_TOKEN_KEY);
    this.endSession();

    if (refreshToken) {
      this.authService.logout(refreshToken).subscribe({ error: () => undefined });
    }
  }

  persistRefreshedSession(response: any) {
    this.persistValue(ACCESS_TOKEN_KEY, response?.data?.accessToken || response?.accessToken);
    this.persistValue(REFRESH_TOKEN_KEY, response?.data?.refreshToken || response?.refreshToken);

    if (response?.data?.user) {
      this.persistValue(USER_KEY, JSON.stringify(response.data.user));
    }

    if (response?.data?.account) {
      this.persistValue(ACCOUNT_KEY, JSON.stringify(response.data.account));
    }

    this.startSession();
  }

  endSession(redirectToLogin = true) {
    this.clearTimers();
    this.showTimeoutWarning.set(false);
    this.isLoggingOut.set(false);

    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ACCOUNT_KEY, SESSION_EXPIRY_KEY].forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });

    if (redirectToLogin) {
      this.router.navigateByUrl('/auth/login');
    }
  }

  isSessionActive() {
    const expiry = Number(this.getStoredValue(SESSION_EXPIRY_KEY));
    return Number.isFinite(expiry) && expiry > Date.now();
  }

  private onActivity() {
    if (!this.getStoredValue(REFRESH_TOKEN_KEY)) {
      return;
    }

    if (!this.isSessionActive()) {
      this.endSession();
      return;
    }

    if (
      this.showTimeoutWarning() ||
      this.renewalInProgress ||
      Date.now() - this.lastRenewalAt < RENEWAL_THROTTLE_MS
    ) {
      return;
    }

    this.renewSession();
  }

  private renewSession() {
    this.renewalInProgress = true;
    this.lastRenewalAt = Date.now();
    this.authService.refreshSession(this.getStoredValue(REFRESH_TOKEN_KEY) || '').subscribe({
      next: (response) => {
        this.persistRefreshedSession(response);
        this.renewalInProgress = false;
      },
      error: () => {
        this.renewalInProgress = false;
        this.endSession();
      },
    });
  }

  private setSessionExpiry(expiry: number) {
    sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiry));
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
      localStorage.setItem(SESSION_EXPIRY_KEY, String(expiry));
    }
    this.scheduleExpiry();
  }

  private scheduleExpiry() {
    this.clearTimers();
    this.showTimeoutWarning.set(false);
    this.isLoggingOut.set(false);

    const expiry = Number(this.getStoredValue(SESSION_EXPIRY_KEY));
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      return;
    }

    const remainingMs = expiry - Date.now();
    this.expiryTimer = window.setTimeout(() => this.beginLogout(), remainingMs);

    if (remainingMs <= SESSION_WARNING_MS) {
      this.showWarning();
    } else {
      this.warningTimer = window.setTimeout(() => this.showWarning(), remainingMs - SESSION_WARNING_MS);
    }
  }

  private showWarning() {
    if (!this.isSessionActive()) {
      this.beginLogout();
      return;
    }

    this.showTimeoutWarning.set(true);
    this.updateCountdown();
    this.countdownTimer = window.setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown() {
    const expiry = Number(this.getStoredValue(SESSION_EXPIRY_KEY));
    const remainingSeconds = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
    this.secondsRemaining.set(remainingSeconds);
  }

  private beginLogout() {
    if (this.isLoggingOut()) {
      return;
    }

    this.clearTimers();
    this.showTimeoutWarning.set(true);
    this.secondsRemaining.set(0);
    this.isLoggingOut.set(true);
    window.setTimeout(() => this.endSession(), LOGOUT_DELAY_MS);
  }

  private clearTimers() {
    [this.expiryTimer, this.warningTimer, this.countdownTimer].forEach((timer) => {
      if (timer) {
        window.clearTimeout(timer);
        window.clearInterval(timer);
      }
    });

    this.expiryTimer = undefined;
    this.warningTimer = undefined;
    this.countdownTimer = undefined;
  }

  private getStoredValue(key: string) {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  }

  private persistValue(key: string, value: string | null | undefined) {
    if (!value) {
      return;
    }

    sessionStorage.setItem(key, value);
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
      localStorage.setItem(key, value);
    }
  }
}

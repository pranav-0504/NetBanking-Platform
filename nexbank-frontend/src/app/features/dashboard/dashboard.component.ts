import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';
const REFRESH_LOADER_MS = 2000;
const AUTO_REFRESH_MS = 3 * 60 * 1000;
const LOGOUT_LOADING_MS = 1500;

interface DashboardUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  role?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
}

interface DashboardAccount {
  accountNumber?: string;
  ifscCode?: string;
  type?: string;
  balance?: number;
  currency?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: DashboardUser | null = this.getStoredUser();
  account: DashboardAccount | null = this.getStoredAccount();
  lastUpdated = new Date();
  accountRefreshing = false;
  loggingOut = false;
  balanceVisible = true;
  private autoRefreshTimer?: number;
  private refreshDelayTimer?: number;

  constructor(
    private router: Router,
    private accountService: AccountService,
    private authService: AuthService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.refreshAccount(false);
  }

  ngOnDestroy() {
    this.clearRefreshTimers();
  }

  refreshAccount(userTriggered = true) {
    if (this.accountRefreshing) {
      return;
    }

    if (userTriggered) {
      this.clearAutoRefreshTimer();
    }

    this.accountRefreshing = true;

    this.refreshDelayTimer = window.setTimeout(() => {
      this.accountService.getMyAccount().subscribe({
        next: (response) => {
          this.accountRefreshing = false;

          if (response?.data) {
            this.account = response.data;
            this.lastUpdated = new Date();
            sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify(response.data));
          }

          this.scheduleAutoRefresh();
        },
        error: (error) => {
          this.accountRefreshing = false;
          console.error('Failed to refresh account balance', error);
          this.scheduleAutoRefresh();
        },
      });
    }, REFRESH_LOADER_MS);
  }

  get fullName() {
    const firstName = this.user?.firstName || '';
    const lastName = this.user?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'NexBank User';
  }

  get initials() {
    return this.fullName
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get formattedBalance() {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.account?.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(this.account?.balance || 0);
  }

  toggleBalanceVisibility() {
    this.balanceVisible = !this.balanceVisible;
  }

  get accountType() {
    return this.account?.type || 'savings';
  }

  logout() {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;
    this.clearRefreshTimers();
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
    this.revokeRefreshToken(refreshToken);

    window.setTimeout(() => {
      this.sessionService.endSession(false);
      this.router.navigateByUrl('/auth/login');
    }, LOGOUT_LOADING_MS);
  }

  private revokeRefreshToken(refreshToken: string | null) {
    if (!refreshToken) {
      return;
    }

    this.authService.logout(refreshToken).subscribe({
      error: () => undefined,
    });
  }

  private scheduleAutoRefresh() {
    this.clearAutoRefreshTimer();
    this.autoRefreshTimer = window.setTimeout(() => this.refreshAccount(false), AUTO_REFRESH_MS);
  }

  private clearAutoRefreshTimer() {
    if (this.autoRefreshTimer) {
      window.clearTimeout(this.autoRefreshTimer);
      this.autoRefreshTimer = undefined;
    }
  }

  private clearRefreshTimers() {
    this.clearAutoRefreshTimer();

    if (this.refreshDelayTimer) {
      window.clearTimeout(this.refreshDelayTimer);
      this.refreshDelayTimer = undefined;
    }
  }

  private getStoredUser(): DashboardUser | null {
    const userJson = sessionStorage.getItem(USER_KEY);

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as DashboardUser;
    } catch {
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  }

  private getStoredAccount(): DashboardAccount | null {
    const accountJson = sessionStorage.getItem(ACCOUNT_KEY);

    if (!accountJson) {
      return null;
    }

    try {
      return JSON.parse(accountJson) as DashboardAccount;
    } catch {
      sessionStorage.removeItem(ACCOUNT_KEY);
      return null;
    }
  }
}

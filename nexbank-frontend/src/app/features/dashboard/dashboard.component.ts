import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';

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
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  user: DashboardUser | null = this.getStoredUser();
  account: DashboardAccount | null = this.getStoredAccount();

  constructor(private router: Router) {}

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

  logout() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACCOUNT_KEY);
    this.router.navigateByUrl('/auth/login');
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

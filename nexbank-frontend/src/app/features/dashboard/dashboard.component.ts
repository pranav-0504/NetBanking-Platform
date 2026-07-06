import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const USER_KEY = 'nexbank_user';

interface DashboardUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  role?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  user: DashboardUser | null = this.getStoredUser();

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
}

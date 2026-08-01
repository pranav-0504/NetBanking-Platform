import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Profile {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  role?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-personal-profile-details',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './personal-profile-details.component.html',
  styleUrl: './personal-profile-details.component.scss',
})
export class PersonalProfileDetailsComponent {
  readonly profile = this.getProfile();

  get name() {
    return `${this.profile?.firstName || ''} ${this.profile?.lastName || ''}`.trim() || this.profile?.fullName || 'NexBank User';
  }

  get mobile() { return this.profile?.mobile || this.profile?.phone || '-'; }
  get initials() { return this.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(); }

  private getProfile(): Profile | null {
    try { return JSON.parse(sessionStorage.getItem('nexbank_user') || '{}'); } catch { return null; }
  }
}

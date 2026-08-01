import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  submitting = false;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;
  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(5)]],
    confirmPassword: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) { this.showMessage('New password and confirmation do not match.'); return; }
    if (currentPassword === newPassword) { this.showMessage('Your new password must be different from your current password.'); return; }
    this.submitting = true;
    this.authService.changePassword(currentPassword || '', newPassword || '').subscribe({
      next: (response) => {
        this.submitting = false;
        this.showMessage(response?.message || 'Password updated. Please sign in again.');
        window.setTimeout(() => { this.sessionService.endSession(false); this.router.navigateByUrl('/auth/login'); }, 1400);
      },
      error: (error) => { this.submitting = false; this.showMessage(error?.error?.message || 'Unable to update password.'); },
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['password-toast'],
    });
  }
}

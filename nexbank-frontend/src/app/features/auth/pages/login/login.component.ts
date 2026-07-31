import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { SessionService } from '../../../../core/services/session.service';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const REFRESH_TOKEN_KEY = 'nexbank_refresh_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';
const REMEMBERED_EMAIL_KEY = 'nexbank_remembered_email';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  hidePassword = signal(true);
  loading = signal(false);

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sessionService: SessionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';

    this.loginForm = this.fb.group({
      email: [rememberedEmail, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      rememberMe: [!!rememberedEmail],
    });
  }

  togglePassword() {
    this.hidePassword.update((value) => !value);
  }

  onSubmit() {
    if (this.loginForm.invalid || this.loading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const rememberMe = !!this.loginForm.value.rememberMe;
    const payload = {
      email: String(this.loginForm.value.email || '').trim().toLowerCase(),
      password: this.loginForm.value.password,
    };

    this.authService.login(payload).subscribe({
      next: (response) => {
        const accessToken = this.getAccessToken(response);

        if (!accessToken) {
          this.loading.set(false);
          this.showMessage('Login successful, but token missing in response.');
          return;
        }

        this.persistAuthValue(ACCESS_TOKEN_KEY, accessToken, rememberMe);
        this.persistAuthValue(REFRESH_TOKEN_KEY, this.getRefreshToken(response) || '', rememberMe);

        if (response?.data?.user) {
          this.persistAuthValue(USER_KEY, JSON.stringify(response.data.user), rememberMe);
        }

        if (response?.data?.account) {
          this.persistAuthValue(ACCOUNT_KEY, JSON.stringify(response.data.account), rememberMe);
        }

        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, payload.email);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(ACCOUNT_KEY);
        }

        this.sessionService.startSession(rememberMe);

        this.loading.set(false);
        this.showMessage('Login successful');
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        this.loading.set(false);
        this.showMessage(error?.error?.message || 'Invalid email or password');
      },
    });
  }

  private persistAuthValue(key: string, value: string, rememberMe: boolean) {
    if (!value) {
      return;
    }

    sessionStorage.setItem(key, value);

    if (rememberMe) {
      localStorage.setItem(key, value);
    }
  }

  private getAccessToken(response: any): string | null {
    return (
      response?.data?.accessToken ||
      response?.data?.token ||
      response?.accessToken ||
      response?.token ||
      null
    );
  }

  private getRefreshToken(response: any): string | null {
    return response?.data?.refreshToken || response?.refreshToken || null;
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  get email() {
    return this.loginForm.controls['email'];
  }

  get password() {
    return this.loginForm.controls['password'];
  }
}

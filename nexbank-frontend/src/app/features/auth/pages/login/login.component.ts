import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const ACCESS_TOKEN_KEY = 'nexbank_access_token';
const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  hidePassword = signal(true);
  loading = signal(false);

  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(2)]],
      rememberMe: [false],
    });

  }

  togglePassword() {
    this.hidePassword.update((value) => !value);
  }

  onSubmit() {
    
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(payload).subscribe({
      
      next: (response) => {
        console.log('Login successful:', response);
        const accessToken = this.getAccessToken(response);
        
        if (!accessToken) {
          this.loading.set(false);
          this.showMessage('Login successful, but token missing in response.');
          return;
        }

        sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

        if (response?.data?.user) {
          sessionStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        }

        if (response?.data?.account) {
          sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify(response.data.account));
        }

        this.loading.set(false);
        this.showMessage('Login Successful');
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        console.error('Login Failed');
        console.error(error);

        this.loading.set(false);
        this.showMessage(error?.error?.message || 'Invalid email or password');
      }

    });
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

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      panelClass: ['success-snackbar'],
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

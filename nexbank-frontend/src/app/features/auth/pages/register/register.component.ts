import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { passwordMatchValidator } from '../../../../shared/password-match.validator';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  loading = signal(false);

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        password: ['', [Validators.required, Validators.minLength(5)]],
        confirmPassword: ['', [Validators.required]],
        acceptTerms: [false, Validators.requiredTrue],
      },
      {
        validators: passwordMatchValidator,
      }
    );
  }

  togglePassword() {
    this.hidePassword.update((value) => !value);
  }

  toggleConfirmPassword() {
    this.hideConfirmPassword.update((value) => !value);
  }

  onSubmit() {
    if (this.registerForm.invalid || this.loading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = {
      firstName: String(this.registerForm.value.firstName || '').trim(),
      lastName: String(this.registerForm.value.lastName || '').trim(),
      email: String(this.registerForm.value.email || '').trim().toLowerCase(),
      mobile: String(this.registerForm.value.mobile || '').trim(),
      password: this.registerForm.value.password,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.registerForm.reset({ acceptTerms: false });
        this.showMessage('Registration successful. Please login to continue.');
        this.router.navigateByUrl('/auth/login');
      },
      error: (error) => {
        this.loading.set(false);
        this.showMessage(error?.error?.message || 'Registration failed. Please check your details.');
      },
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  get firstName() {
    return this.registerForm.controls['firstName'];
  }

  get lastName() {
    return this.registerForm.controls['lastName'];
  }

  get email() {
    return this.registerForm.controls['email'];
  }

  get mobile() {
    return this.registerForm.controls['mobile'];
  }

  get password() {
    return this.registerForm.controls['password'];
  }

  get confirmPassword() {
    return this.registerForm.controls['confirmPassword'];
  }

  get acceptTerms() {
    return this.registerForm.controls['acceptTerms'];
  }
}

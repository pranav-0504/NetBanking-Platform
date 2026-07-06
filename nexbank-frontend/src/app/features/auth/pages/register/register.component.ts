import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { passwordMatchValidator } from '../../../../shared/password-match.validator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink,  MatSnackBarModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  loading = signal(false);

  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      mobile: [
        '',
        [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
      ],
      password: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, Validators.requiredTrue],
    },
    {
      validators: passwordMatchValidator,         //! for password == confirm password match krne ke lie
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
    console.log('Register button clicked');
    
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = {
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      email: this.registerForm.value.email,
      mobile: this.registerForm.value.mobile,
      password: this.registerForm.value.password,
    };

    this.authService.register(payload).subscribe({

      next: (response) => {
        console.log('Registration successful:', response);
        this.loading.set(false);

        this.snackBar.open(
          'Registration Successful 🎉',
          'Close',
          {
            duration: 6000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      },

      error: (error) => {
        // console.error('Registration failed:', error);
        this.loading.set(false);
        const message = error?.error?.message || 'Something went wrong';

        // alert(message);
        this.snackBar.open(
          error.error.message,
          'Close',
          {
            duration: 6000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      } 

    });


    // console.log(this.registerForm.value);
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

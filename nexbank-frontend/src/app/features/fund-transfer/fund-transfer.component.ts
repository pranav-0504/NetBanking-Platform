import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-fund-transfer',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule],
  templateUrl: './fund-transfer.component.html',
  styleUrl: './fund-transfer.component.scss',
})
export class FundTransferComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private transactionService = inject(TransactionService);

  loading = false;

  transferForm = this.fb.group({
    mode: ['IMPS', Validators.required],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    ifscCode: ['', [Validators.required, Validators.pattern(/^NEX00\d{4}$/)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    note: [''],
  });

  submitTransfer() {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.transactionService.transferFunds(this.transferForm.getRawValue()).subscribe({
      next: (response) => {
        this.loading = false;
        this.transferForm.reset({ mode: 'IMPS', accountNumber: '', ifscCode: '', amount: null, note: '' });
        this.showMessage(response?.message || 'Transfer submitted successfully');
      },
      error: (error) => {
        this.loading = false;
        this.showMessage(error?.error?.message || 'Transfer failed');
      },
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}

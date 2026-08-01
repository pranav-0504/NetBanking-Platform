import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransactionService } from '../../core/services/transaction.service';

type StatementRange = 'last_7_days' | 'last_1_month' | 'last_3_months' | 'last_6_months' | 'custom';

interface StatementTransaction {
  _id: string;
  txnId?: string;
  amount: number;
  toUserId?: string;
  transferMode?: string;
  description?: string;
  status: string;
  createdAt?: string;
  balance?: number;
}

@Component({
  selector: 'app-view-account-statement',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './view-account-statement.component.html',
  styleUrl: './view-account-statement.component.scss',
})
export class ViewAccountStatementComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);
  private userId = this.getCurrentUserId();

  readonly periods: { value: StatementRange; title: string; icon: string }[] = [
    { value: 'last_7_days', title: 'Last 7 days', icon: 'date_range' },
    { value: 'last_1_month', title: 'Last 1 month', icon: 'calendar_month' },
    { value: 'last_3_months', title: 'Last 3 months', icon: 'calendar_view_month' },
    { value: 'last_6_months', title: 'Last 6 months', icon: 'event_note' },
    { value: 'custom', title: 'Custom range', icon: 'tune' },
  ];
  selectedRange: StatementRange = 'last_7_days';
  today = new Date().toISOString().slice(0, 10);
  statementForm = this.fb.group({ startDate: [''], endDate: [''] });
  loading = false;
  loaded = false;
  transactions: StatementTransaction[] = [];
  account: { accountNumber?: string; ifscCode?: string; balance?: number } | null = null;
  accountHolderName = '';
  statementPeriod = '';

  selectRange(range: StatementRange) {
    this.selectedRange = range;
    const required = range === 'custom' ? Validators.required : null;
    this.statementForm.controls.startDate.setValidators(required);
    this.statementForm.controls.endDate.setValidators(required);
    this.statementForm.updateValueAndValidity();
  }

  viewStatement() {
    if (this.selectedRange === 'custom' && this.statementForm.invalid) {
      this.statementForm.markAllAsTouched();
      return;
    }
    const { startDate, endDate } = this.statementForm.getRawValue();
    if (this.selectedRange === 'custom' && startDate && endDate && startDate > endDate) {
      this.showMessage('The end date must be on or after the start date.');
      return;
    }

    this.loading = true;
    this.transactionService.viewStatement({
      range: this.selectedRange,
      ...(this.selectedRange === 'custom' ? { startDate: startDate || '', endDate: endDate || '' } : {}),
    }).subscribe({
      next: (response) => {
        const data = response?.data;
        this.account = data?.account || null;
        this.accountHolderName = data?.accountHolderName || '';
        this.statementPeriod = `${this.formatDate(data?.startDate)} – ${this.formatDate(data?.endDate)}`;
        this.transactions = this.withBalances(data?.transactions || [], data?.account?.balance);
        this.loading = false;
        this.loaded = true;
      },
      error: (error) => {
        this.loading = false;
        this.showMessage(error?.error?.message || 'Unable to load your statement. Please try again.');
      },
    });
  }

  isCredit(transaction: StatementTransaction) { return transaction.toUserId === this.userId; }
  getDirection(transaction: StatementTransaction) { return this.isCredit(transaction) ? 'Credit' : 'Debit'; }
  getDetails(transaction: StatementTransaction) { return transaction.description || `${transaction.transferMode || 'Transfer'} transfer`; }
  formatDate(value?: string) { return value ? new Date(value).toLocaleDateString('en-IN') : '-'; }

  private withBalances(transactions: StatementTransaction[], currentBalance?: number) {
    let balance = typeof currentBalance === 'number' ? currentBalance : undefined;
    return transactions.map((transaction) => {
      const row = { ...transaction, balance };
      if (balance !== undefined && transaction.status === 'completed') balance += this.isCredit(transaction) ? -transaction.amount : transaction.amount;
      return row;
    });
  }

  private getCurrentUserId() {
    try { return JSON.parse(sessionStorage.getItem('nexbank_user') || '{}')._id || ''; } catch { return ''; }
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: 'right', verticalPosition: 'top' });
  }
}

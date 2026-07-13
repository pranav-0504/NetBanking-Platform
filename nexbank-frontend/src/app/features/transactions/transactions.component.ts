import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../core/services/transaction.service';

interface TransactionView {
  _id?: string;
  txnId?: string;
  fromAccountId?: { accountNumber?: string };
  toAccountId?: { accountNumber?: string };
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  transferMode?: string;
  status: string;
  createdAt?: string;
}

const USER_KEY = 'nexbank_user';
const REFRESH_LOADER_MS = 2000;

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnDestroy {
  private transactionService = inject(TransactionService);

  transactions: TransactionView[] = [];
  transactionsLoading = false;
  private refreshDelayTimer?: number;
  private currentUserId = this.getCurrentUserId();

  ngOnInit() {
    this.refreshTransactions();
  }

  refreshTransactions() {
    if (this.transactionsLoading) {
      return;
    }

    this.transactionsLoading = true;

    this.refreshDelayTimer = window.setTimeout(() => {
      this.transactionService.getTransactions().subscribe({
        next: (response) => {
          this.transactionsLoading = false;
          this.transactions = response?.data || [];
        },
        error: (error) => {
          this.transactionsLoading = false;
          console.error('Failed to load transactions', error);
        },
      });
    }, REFRESH_LOADER_MS);
  }

  ngOnDestroy() {
    if (this.refreshDelayTimer) {
      window.clearTimeout(this.refreshDelayTimer);
    }
  }

  getTransactionTitle(transaction: TransactionView) {
    if (transaction.transferMode === 'NEFT' && transaction.status === 'pending') {
      return this.isCredit(transaction) ? 'NEFT credit pending' : 'NEFT debit scheduled';
    }

    return this.isCredit(transaction) ? 'Account credited' : 'Account debited';
  }

  getTransactionAccount(transaction: TransactionView) {
    return this.isCredit(transaction)
      ? transaction.fromAccountId?.accountNumber
      : transaction.toAccountId?.accountNumber;
  }

  isCredit(transaction: TransactionView) {
    return transaction.toUserId === this.currentUserId;
  }

  getTransactionDate(transaction: TransactionView) {
    return transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '-';
  }

  getTransactionAmount(transaction: TransactionView) {
    if (transaction.transferMode === 'NEFT' && transaction.status === 'pending') {
      return `Pending INR ${transaction.amount}`;
    }

    return `${this.isCredit(transaction) ? '+' : '-'} INR ${transaction.amount}`;
  }

  private getCurrentUserId() {
    try {
      const user = JSON.parse(sessionStorage.getItem(USER_KEY) || '{}');
      return user?._id || '';
    } catch {
      return '';
    }
  }
}

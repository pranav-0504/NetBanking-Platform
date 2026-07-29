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
  description?: string;
  createdAt?: string;
}

interface TransactionRow extends TransactionView {
  balance?: number;
}

const USER_KEY = 'nexbank_user';
const ACCOUNT_KEY = 'nexbank_account';
const REFRESH_LOADER_MS = 2000;

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnDestroy {
  private transactionService = inject(TransactionService);

  transactions: TransactionRow[] = [];
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
          this.transactions = this.withRunningBalances(response?.data || []);
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

  getTransactionDetails(transaction: TransactionView) {
    if (transaction.transferMode === 'NEFT' && transaction.status === 'pending') {
      return this.isCredit(transaction) ? 'NEFT credit pending' : 'NEFT debit scheduled';
    }

    const counterparty = this.getTransactionAccount(transaction);
    const direction = this.isCredit(transaction) ? 'From' : 'To';
    return transaction.description || `${direction} ${counterparty || 'account'}`;
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

  getTransactionType(transaction: TransactionView) {
    return this.isCredit(transaction) ? 'Credit' : 'Debit';
  }

  getCreditAmount(transaction: TransactionView) {
    return this.isCredit(transaction) && transaction.status === 'completed' ? transaction.amount : null;
  }

  getDebitAmount(transaction: TransactionView) {
    return !this.isCredit(transaction) && transaction.status === 'completed' ? transaction.amount : null;
  }

  getBalance(transaction: TransactionRow) {
    return transaction.status === 'completed' && transaction.balance !== undefined ? transaction.balance : null;
  }

  private withRunningBalances(transactions: TransactionView[]): TransactionRow[] {
    let balance = this.getStoredAccountBalance();

    return transactions.map((transaction) => {
      const row: TransactionRow = { ...transaction, balance };

      if (balance !== undefined && transaction.status === 'completed') {
        balance += this.isCredit(transaction) ? -transaction.amount : transaction.amount;
      }

      return row;
    });
  }

  private getStoredAccountBalance() {
    try {
      const account = JSON.parse(sessionStorage.getItem(ACCOUNT_KEY) || '{}');
      return typeof account?.balance === 'number' ? account.balance : undefined;
    } catch {
      return undefined;
    }
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

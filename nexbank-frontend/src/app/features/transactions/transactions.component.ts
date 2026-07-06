import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
  private transactionService = inject(TransactionService);

  transactions: TransactionView[] = [];
  private currentUserId = this.getCurrentUserId();

  ngOnInit() {
    this.transactionService.getTransactions().subscribe({
      next: (response) => {
        this.transactions = response?.data || [];
      },
      error: (error) => {
        console.error('Failed to load transactions', error);
      },
    });
  }

  getTransactionTitle(transaction: TransactionView) {
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

  private getCurrentUserId() {
    try {
      const user = JSON.parse(sessionStorage.getItem(USER_KEY) || '{}');
      return user?._id || '';
    } catch {
      return '';
    }
  }
}

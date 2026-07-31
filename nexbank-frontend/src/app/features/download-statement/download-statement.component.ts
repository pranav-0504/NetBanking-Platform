import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransactionService } from '../../core/services/transaction.service';

type StatementRange = 'last_7_days' | 'last_1_month' | 'last_3_months' | 'last_6_months' | 'custom';

@Component({
  selector: 'app-download-statement',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './download-statement.component.html',
  styleUrl: './download-statement.component.scss',
})
export class DownloadStatementComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);

  readonly periods: { value: StatementRange; title: string; description: string; icon: string }[] = [
    { value: 'last_7_days', title: 'Last 7 days', description: 'Your most recent activity', icon: 'date_range' },
    { value: 'last_1_month', title: 'Last 1 month', description: 'A complete monthly view', icon: 'calendar_month' },
    { value: 'last_3_months', title: 'Last 3 months', description: 'A quarterly overview', icon: 'calendar_view_month' },
    { value: 'last_6_months', title: 'Last 6 months', description: 'A half-year statement', icon: 'event_note' },
    { value: 'custom', title: 'Custom range', description: 'Select specific start and end dates', icon: 'tune' },
  ];
  downloading = false;
  selectedRange: StatementRange = 'last_7_days';
  today = new Date().toISOString().slice(0, 10);
  statementForm = this.fb.group({ startDate: [''], endDate: [''] });

  selectRange(range: StatementRange) {
    this.selectedRange = range;
    const isCustom = range === 'custom';
    this.statementForm.controls.startDate.setValidators(isCustom ? Validators.required : null);
    this.statementForm.controls.endDate.setValidators(isCustom ? Validators.required : null);
    this.statementForm.updateValueAndValidity();
  }

  download() {
    if (this.selectedRange === 'custom' && this.statementForm.invalid) {
      this.statementForm.markAllAsTouched();
      return;
    }
    const { startDate, endDate } = this.statementForm.getRawValue();
    if (this.selectedRange === 'custom' && startDate && endDate && startDate > endDate) {
      this.showMessage('The end date must be on or after the start date.');
      return;
    }
    this.downloading = true;
    this.transactionService.downloadStatement({ range: this.selectedRange, ...(this.selectedRange === 'custom' ? { startDate: startDate || '', endDate: endDate || '' } : {}) }).subscribe({
      next: (pdf) => {
        this.downloading = false;
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nexbank-statement-${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.showMessage('Your statement PDF is downloading.');
      },
      error: async (error) => {
        this.downloading = false;
        let message = 'Unable to download your statement. Please try again.';
        if (error?.error instanceof Blob) {
          try { message = (await error.error.json())?.message || message; } catch { /* keep fallback */ }
        }
        this.showMessage(message);
      },
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: 'right', verticalPosition: 'top' });
  }
}

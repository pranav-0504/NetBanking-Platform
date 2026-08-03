import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, debounceTime } from 'rxjs';
import { BeneficiaryService } from '../../core/services/beneficiary.service';
import { TransactionService } from '../../core/services/transaction.service';

interface BeneficiaryView {
  _id: string;
  nickName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
}

@Component({
  selector: 'app-fund-transfer',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule],
  templateUrl: './fund-transfer.component.html',
  styleUrl: './fund-transfer.component.scss',
})
export class FundTransferComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private beneficiaryService = inject(BeneficiaryService);
  private transactionService = inject(TransactionService);

  beneficiaries: BeneficiaryView[] = [];
  loading = false;
  beneficiariesLoading = false;
  failureMessage = '';
  successMessage = '';
  redirectSeconds = 10;
  transferCompleted = false;
  openedFromBeneficiary = false;
  entryLoading = false;
  accountNumberError = '';
  ifscCodeError = '';
  private processingTimer?: number;
  private redirectTimer?: number;
  private entryTimer?: number;
  private validationSubscription = new Subscription();

  transferForm = this.fb.group({
    beneficiaryId: [''],
    mode: ['IMPS', Validators.required],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    ifscCode: ['', [Validators.required, Validators.pattern(/^NEX00\d{4}$/)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    note: [''],
  });

  ngOnInit() {
    this.watchPaymentDetailValidation();
    this.openedFromBeneficiary = !!this.route.snapshot.queryParamMap.get('beneficiaryId');
    this.entryLoading = this.openedFromBeneficiary;
    if (this.entryLoading) {
      this.entryTimer = window.setTimeout(() => {
        this.entryLoading = false;
      }, 1000);
    }
    this.loadBeneficiaries();
  }

  ngOnDestroy() {
    this.validationSubscription.unsubscribe();
    if (this.processingTimer) {
      window.clearTimeout(this.processingTimer);
    }

    if (this.redirectTimer) {
      window.clearInterval(this.redirectTimer);
    }

    if (this.entryTimer) {
      window.clearTimeout(this.entryTimer);
    }
  }

  selectBeneficiary(beneficiaryId: string | null | undefined) {
    const beneficiary = this.beneficiaries.find((item) => item._id === beneficiaryId);

    if (!beneficiary) {
      this.transferForm.patchValue({
        beneficiaryId: '',
        accountNumber: '',
        ifscCode: '',
      });
      this.resetPaymentDetailValidation();
      return;
    }

    this.transferForm.patchValue({
      beneficiaryId: beneficiary._id,
      accountNumber: beneficiary.accountNumber,
      ifscCode: beneficiary.ifscCode,
    });
    this.resetPaymentDetailValidation();
  }

  submitTransfer() {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      this.failureMessage = 'Please enter a valid account number, IFSC code, amount and transfer mode.';
      return;
    }

    this.loading = true;
    this.failureMessage = '';
    const transferPayload = this.transferForm.getRawValue();

    this.processingTimer = window.setTimeout(() => {
      this.transactionService.transferFunds(transferPayload).subscribe({
        next: (response) => {
          this.loading = false;
          this.transferForm.reset({ beneficiaryId: '', mode: 'IMPS', accountNumber: '', ifscCode: '', amount: null, note: '' });
          this.showSuccessLanding(response?.message || 'Transfer submitted successfully');
        },
        error: (error) => {
          this.loading = false;
          this.failureMessage = error?.error?.message || 'Transfer failed. Please check the beneficiary details and try again.';
        },
      });
    }, 2000);
  }

  closeFailureModal() {
    this.failureMessage = '';
  }

  private loadBeneficiaries() {
    this.beneficiariesLoading = true;

    this.beneficiaryService.getBeneficiaries().subscribe({
      next: (response) => {
        this.beneficiariesLoading = false;
        this.beneficiaries = response?.data || [];
        this.selectBeneficiary(this.route.snapshot.queryParamMap.get('beneficiaryId'));
      },
      error: (error) => {
        this.beneficiariesLoading = false;
        this.showMessage(error?.error?.message || 'Unable to load beneficiaries');
      },
    });
  }

  private showSuccessLanding(message: string) {
    this.successMessage = message;
    this.transferCompleted = true;
    this.redirectSeconds = 10;

    this.redirectTimer = window.setInterval(() => {
      this.redirectSeconds -= 1;

      if (this.redirectSeconds <= 0) {
        if (this.redirectTimer) {
          window.clearInterval(this.redirectTimer);
        }
        this.router.navigate(['/dashboard']);
      }
    }, 1000);
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  private watchPaymentDetailValidation() {
    const accountNumber = this.transferForm.controls.accountNumber;
    const ifscCode = this.transferForm.controls.ifscCode;

    this.validationSubscription.add(
      accountNumber.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.accountNumberError = this.getAccountNumberError();
      }),
    );

    this.validationSubscription.add(
      ifscCode.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.ifscCodeError = this.getIfscCodeError();
      }),
    );
  }

  private getAccountNumberError(): string {
    const control = this.transferForm.controls.accountNumber;
    if (!control.dirty || !control.invalid || this.transferForm.value.beneficiaryId) {
      return '';
    }

    return control.hasError('required')
      ? 'Account number is required.'
      : 'Enter an 8-digit account number.';
  }

  private getIfscCodeError(): string {
    const control = this.transferForm.controls.ifscCode;
    if (!control.dirty || !control.invalid || this.transferForm.value.beneficiaryId) {
      return '';
    }

    return control.hasError('required')
      ? 'IFSC code is required.'
      : 'Use the format NEX001234.';
  }

  private resetPaymentDetailValidation() {
    this.accountNumberError = '';
    this.ifscCodeError = '';
    this.transferForm.controls.accountNumber.markAsPristine();
    this.transferForm.controls.accountNumber.markAsUntouched();
    this.transferForm.controls.ifscCode.markAsPristine();
    this.transferForm.controls.ifscCode.markAsUntouched();
  }
}

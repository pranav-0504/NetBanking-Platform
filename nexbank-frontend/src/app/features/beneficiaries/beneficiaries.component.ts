import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BeneficiaryService } from '../../core/services/beneficiary.service';

interface BeneficiaryView {
  _id?: string;
  nickName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
}

@Component({
  selector: 'app-beneficiaries',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule],
  templateUrl: './beneficiaries.component.html',
  styleUrl: './beneficiaries.component.scss',
})
export class BeneficiariesComponent {
  private fb = inject(FormBuilder);
  private beneficiaryService = inject(BeneficiaryService);
  private snackBar = inject(MatSnackBar);

  beneficiaries: BeneficiaryView[] = [];
  loading = false;
  listLoading = true;
  searchTerm = '';

  beneficiaryForm = this.fb.group({
    nickName: ['', Validators.required],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    ifscCode: ['', [Validators.required, Validators.pattern(/^NEX00\d{4}$/)]],
  });

  addPreviewBeneficiary() {
    if (this.beneficiaryForm.invalid) {
      this.beneficiaryForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.beneficiaryService.addBeneficiary(this.beneficiaryForm.getRawValue()).subscribe({
      next: (response) => {
        this.loading = false;
        this.beneficiaryForm.reset();
        this.beneficiaries = [response.data, ...this.beneficiaries];
        this.showMessage(response?.message || 'Beneficiary added successfully');
      },
      error: (error) => {
        this.loading = false;
        this.showMessage(error?.error?.message || 'Unable to add beneficiary');
      },
    });
  }

  removeBeneficiary(index: number) {
    const beneficiary = this.beneficiaries[index];

    if (!beneficiary?._id) {
      return;
    }

    this.beneficiaryService.removeBeneficiary(beneficiary._id).subscribe({
      next: () => {
        this.beneficiaries = this.beneficiaries.filter((_, currentIndex) => currentIndex !== index);
        this.showMessage('Beneficiary removed successfully');
      },
      error: (error) => {
        this.showMessage(error?.error?.message || 'Unable to remove beneficiary');
      },
    });
  }

  ngOnInit() {
    this.beneficiaryService.getBeneficiaries().subscribe({
      next: (response) => {
        this.beneficiaries = response?.data || [];
        this.listLoading = false;
      },
      error: (error) => {
        this.listLoading = false;
        this.showMessage(error?.error?.message || 'Unable to load beneficiaries');
      },
    });
  }

  get filteredBeneficiaries() {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.beneficiaries;
    }

    return this.beneficiaries.filter((beneficiary) =>
      [beneficiary.nickName, beneficiary.accountHolderName, beneficiary.accountNumber, beneficiary.ifscCode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }

  beneficiaryInitial(beneficiary: BeneficiaryView) {
    return (beneficiary.nickName || 'B').trim().charAt(0).toUpperCase();
  }

  maskedAccountNumber(accountNumber: string) {
    return `•••• ${accountNumber.slice(-4)}`;
  }

  trackBeneficiary(_: number, beneficiary: BeneficiaryView) {
    return beneficiary._id || beneficiary.accountNumber;
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}

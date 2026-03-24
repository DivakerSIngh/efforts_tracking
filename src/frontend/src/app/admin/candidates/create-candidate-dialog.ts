import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminService } from '../admin';

@Component({
  selector: 'app-create-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
  ],
  template: `
    <div class="dlg-inner">
      <div class="dlg-handle"></div>

      <div class="dlg-header">
        <mat-icon class="dlg-icon">person_add</mat-icon>
        <div>
          <h2 class="dlg-title">New Candidate</h2>
          <p class="dlg-subtitle">Create account & send login credentials</p>
        </div>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="create-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Full Name</mat-label>
            <mat-icon matPrefix>badge</mat-icon>
            <input matInput formControlName="full_name" placeholder="e.g. Jane Smith">
            <mat-error>Full name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="email" placeholder="jane@example.com">
            <mat-error>Enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput type="password" formControlName="password" placeholder="Min 8 characters">
            <mat-error>At least 8 characters required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Phone</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput formControlName="phone" placeholder="+1-555-0100">
          </mat-form-field>

          <div class="rate-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Hourly Rate (₹)</mat-label>
              <mat-icon matPrefix>schedule</mat-icon>
              <input matInput type="number" formControlName="hourly_rate" min="0" step="0.5">
            </mat-form-field>
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Fixed Amount (₹)</mat-label>
              <mat-icon matPrefix>payments</mat-icon>
              <input matInput type="number" formControlName="fixed_amount" min="0" step="0.01">
            </mat-form-field>
          </div>

          <div class="section-divider">
            <mat-icon>account_balance</mat-icon>
            <span>Bank Account Details</span>
          </div>

          <div class="rate-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Account Number</mat-label>
              <mat-icon matPrefix>credit_card</mat-icon>
              <input matInput formControlName="account_no" placeholder="e.g. 001234567890">
            </mat-form-field>
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>IFSC Code</mat-label>
              <mat-icon matPrefix>tag</mat-icon>
              <input matInput formControlName="ifsc_code" placeholder="e.g. SBIN0001234">
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button mat-dialog-close class="btn-cancel">Cancel</button>
        <button mat-flat-button class="btn-primary" (click)="submit()" [disabled]="saving">
          <mat-icon>{{ saving ? 'hourglass_empty' : 'person_add' }}</mat-icon>
          {{ saving ? 'Creating…' : 'Create & Send Credentials' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dlg-inner { padding: 4px 0 0; }
    .dlg-handle { width: 36px; height: 4px; background: #e5e7eb; border-radius: 4px; margin: 0 auto 20px; }
    .dlg-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .dlg-icon {
      width: 40px; height: 40px; font-size: 22px; border-radius: 12px;
      background: #ecfdf5; color: #10b981;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .dlg-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .dlg-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }
    .create-form { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
    .full-width { width: 100%; }
    .rate-row { display: flex; gap: 12px; width: 100%; }
    .half-width { flex: 1; min-width: 0; }
    .section-divider {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.8rem; font-weight: 600; color: #374151;
      padding: 6px 0 2px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #6366f1; }
    }
    // .dlg-actions { padding: 8px 0 4px; gap: 8px; }
    .btn-cancel { color: #6b7280; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 20px; border-radius: 10px; font-weight: 600; font-size: 0.875rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #2563eb 100%) !important;
      color: #fff !important;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
  `],
})
export class CreateCandidateDialog {
  form!: FormGroup;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<CreateCandidateDialog>,
    private admin: AdminService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      full_name:    ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      password:     ['', [Validators.required, Validators.minLength(8)]],
      phone:        [''],
      hourly_rate:  [0, [Validators.min(0)]],
      fixed_amount: [0, [Validators.min(0)]],
      account_no:   [''],
      ifsc_code:    [''],
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.admin.createCandidate(this.form.value).subscribe({
      next: (c) => this.dialogRef.close(c),
      error: () => { this.saving = false; },
    });
  }
}

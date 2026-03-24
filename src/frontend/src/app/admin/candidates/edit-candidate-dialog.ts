import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../admin';
import { Candidate } from '../../core/models';

@Component({
  selector: 'app-edit-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSnackBarModule,
  ],
  template: `
    <div class="dlg-inner">
      <div class="dlg-handle"></div>

      <div class="dlg-header">
        <div class="dlg-icon"><mat-icon>edit</mat-icon></div>
        <div>
          <h2 class="dlg-title">Edit Candidate</h2>
          <p class="dlg-subtitle">{{ data.full_name }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="edit-form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Phone</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput formControlName="phone" placeholder="+91-XXXXXXXXXX">
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
          <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
          {{ saving ? 'Saving…' : 'Save Changes' }}
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
      background: #eff6ff; color: #3b82f6;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .dlg-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .dlg-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }
    .edit-form { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
    .full-width { width: 100%; }
    .rate-row { display: flex; gap: 12px; width: 100%; }
    .half-width { flex: 1; min-width: 0; }
    .section-divider {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.8rem; font-weight: 600; color: #374151;
      padding: 6px 0 2px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #6366f1; }
    }
    .btn-cancel { color: #6b7280; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 20px; border-radius: 10px; font-weight: 600; font-size: 0.875rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
      color: #fff !important;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
  `],
})
export class EditCandidateDialog {
  form!: FormGroup;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<EditCandidateDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Candidate,
    private admin: AdminService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      phone:        [data.phone ?? ''],
      hourly_rate:  [data.hourly_rate ?? 0, [Validators.min(0)]],
      fixed_amount: [data.fixed_amount ?? 0, [Validators.min(0)]],
      account_no:   [data.account_no ?? ''],
      ifsc_code:    [data.ifsc_code ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.admin.updateCandidate(this.data.user_id, this.form.value).subscribe({
      next: (updated) => {
        this.snack.open('Candidate updated successfully', undefined, { duration: 2500 });
        this.dialogRef.close(updated);
      },
      error: () => {
        this.saving = false;
        this.snack.open('Failed to update candidate', 'Close', { duration: 3500 });
      },
    });
  }
}

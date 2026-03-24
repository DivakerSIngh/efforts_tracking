import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../admin';
import { Candidate } from '../../core/models';

export interface AssignCandidateDialogData {
  projectId: number;
  projectName: string;
}

@Component({
  selector: 'app-assign-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <div class="dlg-inner">
      <div class="dlg-handle"></div>

      <div class="dlg-header">
        <span class="dlg-icon">
          <mat-icon>person_add</mat-icon>
        </span>
        <div>
          <h2 class="dlg-title">Assign Candidate</h2>
          <p class="dlg-subtitle">{{ data.projectName }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select Candidate</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <mat-select formControlName="candidate_id">
              @for (c of candidates; track c.user_id) {
                <mat-option [value]="c.user_id">{{ c.full_name }} — {{ c.email }}</mat-option>
              }
            </mat-select>
            <mat-error>Please select a candidate</mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button mat-dialog-close class="btn-cancel">Cancel</button>
        <button mat-flat-button class="btn-primary" (click)="assign()" [disabled]="saving || form.invalid">
          <mat-icon>{{ saving ? 'hourglass_empty' : 'link' }}</mat-icon>
          {{ saving ? 'Assigning…' : 'Assign' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dlg-inner { padding: 4px 0 0; min-width: 360px; }
    .dlg-handle {
      width: 36px; height: 4px; background: #e5e7eb;
      border-radius: 4px; margin: 0 auto 20px;
    }
    .dlg-header {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 0 24px; margin-bottom: 8px;
    }
    .dlg-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: #ecfdf5; color: #059669;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .dlg-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .dlg-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }
    mat-dialog-content {
      padding: 16px 24px 8px !important;
    }
    .full-width { width: 100%; }
    .dlg-actions { padding: 8px 24px 16px !important; gap: 8px; }
    .btn-cancel { color: #6b7280; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 20px; border-radius: 10px;
      font-weight: 600; font-size: 0.875rem;
      background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
      color: #fff !important;
      box-shadow: 0 4px 12px rgba(5,150,105,0.3) !important;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
  `],
})
export class AssignCandidateDialog implements OnInit {
  form!: FormGroup;
  candidates: Candidate[] = [];
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<AssignCandidateDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AssignCandidateDialogData,
    private admin: AdminService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({ candidate_id: [null, Validators.required] });
    this.admin.getCandidates().subscribe(c => this.candidates = c.filter(x => x.is_active));
  }

  assign(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.admin.assignProject(this.form.value.candidate_id, this.data.projectId).subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Candidate assigned successfully', undefined, { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.detail ?? 'Failed to assign candidate';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }
}

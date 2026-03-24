import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AdminService } from '../admin';
import { Project } from '../../core/models';

export interface AssignProjectDialogData {
  candidateId: number;
  candidateName: string;
}

@Component({
  selector: 'app-assign-project-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule,
  ],
  template: `
    <div class="dlg-inner">
      <div class="dlg-handle"></div>

      <div class="dlg-header">
        <mat-icon class="dlg-icon">link</mat-icon>
        <div>
          <h2 class="dlg-title">Assign Project</h2>
          <p class="dlg-subtitle">{{ data.candidateName }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select Project</mat-label>
            <mat-icon matPrefix>folder_special</mat-icon>
            <mat-select formControlName="project_id">
              <mat-option *ngFor="let p of projects" [value]="p.project_id">{{ p.name }}</mat-option>
            </mat-select>
            <mat-error>Please select a project</mat-error>
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
    .dlg-inner { padding: 4px 0 0; }
    .dlg-handle { width: 36px; height: 4px; background: #e5e7eb; border-radius: 4px; margin: 0 auto 20px; }
    .dlg-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
    .dlg-icon {
      width: 40px; height: 40px; font-size: 22px; border-radius: 12px;
      background: #eef2ff; color: #4f46e5;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .dlg-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .dlg-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }
    .full-width { width: 100%; }
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
export class AssignProjectDialog implements OnInit {
  form!: FormGroup;
  projects: Project[] = [];
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<AssignProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AssignProjectDialogData,
    private admin: AdminService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({ project_id: [null, Validators.required] });
    this.admin.getProjects().subscribe(p => this.projects = p.filter(pr => pr.is_active));
  }

  assign(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.admin.assignProject(this.data.candidateId, this.form.value.project_id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; },
    });
  }
}

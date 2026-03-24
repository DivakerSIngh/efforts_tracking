import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../admin';
import { Project } from '../../core/models';

export interface ProjectDialogData {
  /** Pass an existing project to open in edit mode; omit for create mode. */
  project?: Project;
}

@Component({
  selector: 'app-project-dialog',
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
        <span class="dlg-icon">
          <mat-icon>{{ isEdit ? 'edit' : 'folder_open' }}</mat-icon>
        </span>
        <div>
          <h2 class="dlg-title">{{ isEdit ? 'Edit Project' : 'New Project' }}</h2>
          <p class="dlg-subtitle">{{ isEdit ? 'Update project details' : 'Fill in the project details below' }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" id="project-form" (ngSubmit)="save()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Project Name</mat-label>
            <mat-icon matPrefix>label</mat-icon>
            <input matInput formControlName="name" placeholder="e.g. Portal Redesign" autocomplete="off">
            <mat-error *ngIf="form.get('name')?.errors?.['required']">Project name is required</mat-error>
            <mat-error *ngIf="form.get('name')?.errors?.['maxlength']">Max 200 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Client Name</mat-label>
            <mat-icon matPrefix>business</mat-icon>
            <input matInput formControlName="client_name" placeholder="e.g. Acme Corp" autocomplete="off">
            <mat-error *ngIf="form.get('client_name')?.errors?.['maxlength']">Max 200 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Details / Description</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput formControlName="description" rows="3"
                      placeholder="Brief description of this project..."></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button mat-dialog-close class="btn-cancel">Cancel</button>
        <button mat-flat-button class="btn-primary" (click)="save()" [disabled]="saving || form.invalid">
          <mat-icon>{{ saving ? 'hourglass_empty' : (isEdit ? 'save' : 'add') }}</mat-icon>
          {{ saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Project') }}
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
      background: #eef2ff; color: #4f46e5;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .dlg-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .dlg-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }
    mat-dialog-content {
      padding: 16px 24px 8px !important;
      display: flex; flex-direction: column; gap: 0;
    }
    .full-width { width: 100%; margin-bottom: 4px; }
    .dlg-actions { padding: 8px 24px 16px !important; gap: 8px; }
    .btn-cancel { color: #6b7280; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 20px; border-radius: 10px;
      font-weight: 600; font-size: 0.875rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #2563eb 100%) !important;
      color: #fff !important;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35) !important;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
  `],
})
export class ProjectDialog implements OnInit {
  form!: FormGroup;
  saving = false;
  isEdit = false;

  constructor(
    public dialogRef: MatDialogRef<ProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectDialogData,
    private admin: AdminService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data?.project;
    this.form = this.fb.group({
      name:        [this.data?.project?.name ?? '', [Validators.required, Validators.maxLength(200)]],
      client_name: [this.data?.project?.client_name ?? '', [Validators.maxLength(200)]],
      description: [this.data?.project?.description ?? ''],
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const obs = this.isEdit
      ? this.admin.updateProject(this.data.project!.project_id, this.form.value)
      : this.admin.createProject(this.form.value);

    obs.subscribe({
      next: (result) => {
        this.saving = false;
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.detail ?? (this.isEdit ? 'Failed to update project' : 'Failed to create project');
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }
}

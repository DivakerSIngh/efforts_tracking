import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { AdminService } from '../admin';
import { Candidate, Project } from '../../core/models';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatProgressBarModule, MatTableModule, MatChipsModule,
  ],
  templateUrl: './assignments.html',
  styleUrl: './assignments.scss',
})
export class Assignments implements OnInit {

  loading  = false;
  saving   = false;
  candidates: Candidate[] = [];
  projects:   Project[]   = [];
  form!: FormGroup;

  constructor(private admin: AdminService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      candidateId: [null, Validators.required],
      projectId:   [null, Validators.required],
    });
    this.loading = true;
    forkJoin({ candidates: this.admin.getCandidates(), projects: this.admin.getProjects() }).subscribe({
      next: ({ candidates, projects }) => {
        this.candidates = candidates.filter(c => c.is_active);
        this.projects   = projects.filter(p => p.is_active);
        this.loading    = false;
      },
      error: () => { this.loading = false; },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { candidateId, projectId } = this.form.value;
    this.saving = true;
    this.admin.assignProject(candidateId, projectId).subscribe({
      next: () => {
        this.saving = false;
        this.form.reset();
        this.snack.open('Project assigned successfully', undefined, { duration: 2500 });
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.detail ?? 'Assignment failed';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  getCandidateName(id: number): string {
    return this.candidates.find(c => c.user_id === id)?.full_name ?? '';
  }

  getProjectName(id: number): string {
    return this.projects.find(p => p.project_id === id)?.name ?? '';
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../admin';
import { Project } from '../../core/models';
import { ProjectDialog } from './project-dialog';
import { AssignCandidateDialog } from './assign-candidate-dialog';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressBarModule,
    MatTooltipModule, MatDialogModule,
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects implements OnInit {

  loading = false;
  projects: Project[] = [];
  searchQuery = '';
  statusFilter = '';

  get filteredProjects(): Project[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.projects.filter(p => {
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.client_name ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'active' ? p.is_active : !p.is_active);
      return matchSearch && matchStatus;
    });
  }

  applyFilter(): void { /* template drives re-evaluation via getter */ }

  resetFilter(): void {
    this.searchQuery = '';
    this.statusFilter = '';
  }

  private gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  ];

  get activeCount(): number {
    return this.projects.filter(p => p.is_active).length;
  }

  getProjectGradient(index: number): string {
    return this.gradients[index % this.gradients.length];
  }

  constructor(
    private admin: AdminService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.admin.getProjects().subscribe({
      next: (p) => { this.projects = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ProjectDialog, {
      width: '460px',
      maxWidth: '95vw',
      panelClass: 'iphone-dialog',
      data: {},
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.projects = [...this.projects, result];
        this.snack.open('Project created', undefined, { duration: 2500 });
      }
    });
  }

  openEditDialog(project: Project): void {
    const ref = this.dialog.open(ProjectDialog, {
      width: '460px',
      maxWidth: '95vw',
      panelClass: 'iphone-dialog',
      data: { project },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.projects = this.projects.map(p =>
          p.project_id === project.project_id ? { ...p, ...result } : p
        );
        this.snack.open('Project updated', undefined, { duration: 2500 });
      }
    });
  }

  openAssignCandidateDialog(project: Project): void {
    const ref = this.dialog.open(AssignCandidateDialog, {
      width: '460px',
      maxWidth: '95vw',
      panelClass: 'iphone-dialog',
      data: { projectId: project.project_id, projectName: project.name },
    });
    ref.afterClosed().subscribe(assigned => {
      if (assigned) {
        this.projects = this.projects.map(p =>
          p.project_id === project.project_id
            ? { ...p, candidate_count: (p.candidate_count ?? 0) + 1 }
            : p
        );
      }
    });
  }
}



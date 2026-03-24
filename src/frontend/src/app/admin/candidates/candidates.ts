import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminService } from '../admin';
import { Candidate } from '../../core/models';
import { AssignProjectDialog } from './assign-project-dialog';
import { EditCandidateDialog } from './edit-candidate-dialog';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatSnackBarModule, MatProgressBarModule, MatTooltipModule,
    MatSlideToggleModule, MatDialogModule,
  ],
  templateUrl: './candidates.html',
  styleUrl: './candidates.scss',
})
export class Candidates implements OnInit, AfterViewInit {

  loading = false;
  saving  = false;
  dataSource = new MatTableDataSource<Candidate>([]);
  displayedColumns = ['full_name', 'email', 'phone', 'hourly_rate', 'fixed_amount', 'status', 'actions'];

  showForm = false;
  form!: FormGroup;

  // Filter state
  searchQuery  = '';
  statusFilter = '';

  @ViewChild(MatSort)      sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private admin: AdminService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      full_name:    ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      password:     ['', [Validators.required, Validators.minLength(8)]],
      phone:        [''],
      hourly_rate:  [0, [Validators.min(0)]],
      fixed_amount: [0, [Validators.min(0)]],
    });
    this.loadCandidates();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort      = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadCandidates(): void {
    this.loading = true;
    this.admin.getCandidates().subscribe({
      next: (c) => { this.dataSource.data = c; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.admin.createCandidate(this.form.value).subscribe({
      next: () => {
        this.form.reset({ hourly_rate: 0, fixed_amount: 0 });
        this.showForm = false;
        this.saving   = false;
        this.snack.open('Candidate created. Login credentials emailed.', undefined, { duration: 3000 });
        this.loadCandidates();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.detail ?? 'Failed to create candidate';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  toggleStatus(c: Candidate): void {
    this.admin.setCandidateStatus(c.user_id, !c.is_active).subscribe({
      next: () => {
        c.is_active = !c.is_active;
        this.snack.open(`Candidate ${c.is_active ? 'activated' : 'deactivated'}`, undefined, { duration: 2000 });
      },
      error: () => this.snack.open('Failed to update status', 'Close', { duration: 3000 }),
    });
  }

  openAssignDialog(c: Candidate): void {
    const ref = this.dialog.open(AssignProjectDialog, {
      width: '440px',
      maxWidth: '95vw',
      panelClass: 'iphone-dialog',
      data: { candidateId: c.user_id, candidateName: c.full_name },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.snack.open('Project assigned successfully', undefined, { duration: 2500 });
    });
  }

  openEditDialog(c: Candidate): void {
    const ref = this.dialog.open(EditCandidateDialog, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'iphone-dialog',
      data: c,
    });
    ref.afterClosed().subscribe(updated => {
      if (updated) this.loadCandidates();
    });
  }

  viewTimesheet(c: Candidate): void {
    this.router.navigate(['/admin/candidates', c.user_id, 'timesheet'], {
      state: { candidateName: c.full_name },
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const s = this.statusFilter;
    this.dataSource.filterPredicate = (row: Candidate) => {
      const matchSearch = !q ||
        row.full_name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        (row as any).phone?.toLowerCase().includes(q);
      const matchStatus = !s ||
        (s === 'active'   &&  row.is_active) ||
        (s === 'inactive' && !row.is_active);
      return matchSearch && matchStatus;
    };
    // Trigger re-filter
    this.dataSource.filter = q || s ? 'active' : '';
  }

  resetFilter(): void {
    this.searchQuery  = '';
    this.statusFilter = '';
    this.dataSource.filter = '';
  }
}


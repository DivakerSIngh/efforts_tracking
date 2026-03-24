import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../admin';
import { Project, TimesheetEntry, Candidate } from '../../core/models';

interface CellData {
  hours: number | null;
  remarks: string;
}

interface DayRow {
  date: string;
  dayNum: number;
  dayName: string;
  isWeekend: boolean;
  cells: Record<string, CellData>;
  totalHours: number;
}

@Component({
  selector: 'app-candidate-timesheet-view',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatProgressBarModule,
    MatButtonModule, MatTooltipModule,
  ],
  template: `
    <div class="ts-view-page">
      <!-- Header -->
      <div class="ts-header">
        <button mat-icon-button class="back-btn" (click)="goBack()" matTooltip="Back to Candidates">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="ts-header-info">
          <div class="ts-breadcrumb">Candidates / Timesheet View</div>
          <h2 class="ts-title">
            <mat-icon>calendar_month</mat-icon>
            {{ candidateName || 'Candidate' }} — Timesheet
          </h2>
        </div>
      </div>

      <mat-progress-bar *ngIf="loading" mode="indeterminate" class="page-loader"></mat-progress-bar>

      <!-- Month Navigation -->
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <span class="month-label">{{ monthLabel }}</span>
        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <!-- No projects state -->
      <div class="empty-state" *ngIf="!loading && projects.length === 0">
        <mat-icon>folder_off</mat-icon>
        <p>No projects assigned to this candidate.</p>
      </div>

      <!-- Timesheet Grid -->
      <div class="ts-table-wrap" *ngIf="projects.length > 0">
        <table class="ts-table">
          <thead>
            <tr>
              <th class="day-col">Day</th>
              <th class="date-col">Date</th>
              <th *ngFor="let p of projects" class="proj-col">{{ p.name }}</th>
              <th class="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of dayRows"
                [class.weekend-row]="row.isWeekend">
              <td class="day-col">{{ row.dayName }}</td>
              <td class="date-col">{{ row.dayNum }}</td>
              <td *ngFor="let p of projects" class="proj-col hours-cell">
                <span *ngIf="row.cells[p.project_id]?.hours" class="hours-badge">
                  {{ row.cells[p.project_id].hours | number:'1.1-2' }}
                </span>
                <span *ngIf="!row.cells[p.project_id]?.hours" class="hours-empty">—</span>
              </td>
              <td class="total-col">
                <span *ngIf="row.totalHours > 0" class="total-pill">{{ row.totalHours | number:'1.1-2' }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td class="day-col" colspan="2"><strong>Total</strong></td>
              <td *ngFor="let p of projects" class="proj-col">
                <strong>{{ projectTotals[p.project_id] | number:'1.1-2' }}</strong>
              </td>
              <td class="total-col">
                <strong>{{ grandTotal | number:'1.1-2' }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .ts-view-page { padding: 24px; max-width: 100%; }
    .ts-header {
      display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;
    }
    .back-btn { flex-shrink: 0; margin-top: 2px; }
    .ts-breadcrumb { font-size: 0.75rem; color: #9ca3af; margin-bottom: 2px; }
    .ts-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0;
      mat-icon { color: #6366f1; }
    }
    .page-loader { margin-bottom: 16px; }
    .month-nav {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 20px;
    }
    .month-label {
      font-size: 1rem; font-weight: 600; color: #374151; min-width: 160px; text-align: center;
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px 0; color: #9ca3af;
      mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
    }
    .ts-table-wrap { overflow-x: auto; }
    .ts-table {
      width: 100%; border-collapse: collapse;
      font-size: 0.82rem;
    }
    .ts-table th, .ts-table td {
      border: 1px solid #e5e7eb;
      padding: 6px 10px;
      text-align: left;
      white-space: nowrap;
    }
    .ts-table thead th {
      background: #f8fafc; font-weight: 600; color: #374151;
    }
    .ts-table tfoot td { background: #f1f5f9; }
    .weekend-row td { background: #fef9f0; color: #92400e; }
    .day-col { width: 44px; }
    .date-col { width: 48px; text-align: center; }
    .proj-col { text-align: center; }
    .total-col { text-align: center; font-weight: 600; }
    .hours-badge {
      display: inline-block; background: #dbeafe; color: #1d4ed8;
      border-radius: 6px; padding: 2px 7px; font-weight: 600;
    }
    .hours-empty { color: #d1d5db; }
    .total-pill {
      display: inline-block; background: #d1fae5; color: #065f46;
      border-radius: 8px; padding: 2px 8px; font-weight: 700;
    }
    .totals-row td { border-top: 2px solid #cbd5e1; }
  `],
})
export class CandidateTimesheetView implements OnInit {
  candidateId!: number;
  candidateName = '';
  loading = false;
  projects: Project[] = [];
  dayRows: DayRow[] = [];
  projectTotals: Record<number, number> = {};
  grandTotal = 0;
  viewMonth!: Date;

  get monthLabel(): string {
    return this.viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admin: AdminService,
  ) {}

  ngOnInit(): void {
    this.candidateId = Number(this.route.snapshot.paramMap.get('id'));
    const state = history.state as any;
    this.candidateName = state?.candidateName ?? '';
    const now = new Date();
    this.viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.loadProjects();
  }

  goBack(): void {
    this.router.navigate(['/admin/candidates']);
  }

  prevMonth(): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1);
    this.loadTimesheet();
  }

  nextMonth(): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1);
    this.loadTimesheet();
  }

  private loadProjects(): void {
    this.loading = true;
    this.admin.getCandidateProjects(this.candidateId).subscribe({
      next: (p) => {
        this.projects = p;
        this.loadTimesheet();
      },
      error: () => { this.loading = false; },
    });
  }

  private loadTimesheet(): void {
    this.loading = true;
    const month = this.viewMonth.getMonth() + 1;
    const year  = this.viewMonth.getFullYear();
    this.admin.getCandidateTimesheet(this.candidateId, month, year).subscribe({
      next: (entries) => {
        this.buildGrid(entries);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private buildGrid(entries: TimesheetEntry[]): void {
    const year  = this.viewMonth.getFullYear();
    const month = this.viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    this.projectTotals = {};
    this.projects.forEach(p => { this.projectTotals[p.project_id] = 0; });

    this.dayRows = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return {
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        dayNum: i + 1,
        dayName: dayNames[d.getDay()],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        cells: {},
        totalHours: 0,
      } as DayRow;
    });

    entries.forEach(e => {
      const dayPart = e.entry_date.substring(8, 10);
      const dayIdx  = parseInt(dayPart, 10) - 1;
      if (dayIdx < 0 || dayIdx >= this.dayRows.length) return;
      const row = this.dayRows[dayIdx];
      row.cells[e.project_id] = { hours: e.hours, remarks: e.remarks ?? '' };
      row.totalHours += e.hours;
      this.projectTotals[e.project_id] = (this.projectTotals[e.project_id] ?? 0) + e.hours;
    });

    this.grandTotal = Object.values(this.projectTotals).reduce((s, v) => s + v, 0);
  }
}

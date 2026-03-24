import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimesheetService } from '../timesheet';
import { Project, TimesheetEntry as TimesheetEntryModel } from '../../core/models';

interface CellData {
  entryId?: number;
  hours: number | null;
  isDirty: boolean;
  isSaving: boolean;
}

interface DayRow {
  date: string;        // 'YYYY-MM-DD'
  dayNum: number;      // 1-31
  dayName: string;     // 'Mon', 'Tue'...
  isWeekend: boolean;
  isToday: boolean;
  cells: Record<string, CellData>;
  remarks: string;
  remarksDirty: boolean;
  remarksSaving: boolean;
}

@Component({
  selector: 'app-timesheet-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './timesheet-entry.html',
  styleUrl: './timesheet-entry.scss',
})
export class TimesheetEntry implements OnInit {

  loading = false;
  projects: Project[] = [];
  dayRows: DayRow[] = [];

  viewMonth!: Date;

  get isCurrentMonth(): boolean {
    const now = new Date();
    return this.viewMonth.getFullYear() === now.getFullYear()
      && this.viewMonth.getMonth() === now.getMonth();
  }

  get monthLabel(): string {
    return this.viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  constructor(
    private ts: TimesheetService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.loadProjects();
  }

  private loadProjects(): void {
    this.ts.getAssignedProjects().subscribe({
      next: (p) => {
        this.projects = p;
        this.loadTimesheet();
      },
      error: () => this.snack.open('Failed to load projects', 'Close', { duration: 3000 }),
    });
  }

  private loadTimesheet(): void {
    this.loading = true;
    const m = this.viewMonth.getMonth() + 1;
    const y = this.viewMonth.getFullYear();
    this.ts.getTimesheet(m, y).subscribe({
      next: (entries) => {
        this.buildDayRows(entries);
        this.loading = false;
      },
      error: () => {
        this.buildDayRows([]);
        this.loading = false;
      },
    });
  }

  private buildDayRows(entries: TimesheetEntryModel[]): void {
    const y = this.viewMonth.getFullYear();
    const m = this.viewMonth.getMonth(); // 0-indexed
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayStr = this.toDateStr(new Date());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    this.dayRows = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const date = new Date(y, m, d);
      const dateStr = this.toDateStr(date);
      const dow = date.getDay();

      const cells: Record<string, CellData> = {};
      for (const proj of this.projects) {
        const key = `proj_${proj.project_id}`;
        const existing = entries.find(
          (e) => e.entry_date === dateStr && e.project_id === proj.project_id
        );
        cells[key] = {
          entryId: existing?.entry_id,
          hours: existing?.hours ?? null,
          isDirty: false,
          isSaving: false,
        };
      }

      // Use the first non-empty remark found for this day
      const dayRemarks = entries.find(
        (e) => e.entry_date === dateStr && e.remarks
      )?.remarks ?? '';

      return {
        date: dateStr,
        dayNum: d,
        dayName: dayNames[dow],
        isWeekend: dow === 0 || dow === 6,
        isToday: dateStr === todayStr,
        cells,
        remarks: dayRemarks,
        remarksDirty: false,
        remarksSaving: false,
      };
    });
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  prevMonth(): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1);
    this.loadTimesheet();
  }

  nextMonth(): void {
    if (this.isCurrentMonth) return;
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1);
    this.loadTimesheet();
  }

  cellKey(projectId: number): string {
    return `proj_${projectId}`;
  }

  markDirty(row: DayRow, projectId: number): void {
    row.cells[this.cellKey(projectId)].isDirty = true;
  }

  saveCell(row: DayRow, projectId: number): void {
    const key = this.cellKey(projectId);
    const cell = row.cells[key];
    if (!cell.isDirty) return;

    const hours = cell.hours;
    cell.isSaving = true;
    cell.isDirty = false;

    if (cell.entryId) {
      if (hours == null || hours <= 0) {
        // Delete entry
        this.ts.deleteEntry(cell.entryId).subscribe({
          next: () => {
            cell.entryId = undefined;
            cell.hours = null;
            cell.isSaving = false;
          },
          error: () => {
            cell.isSaving = false;
            this.snack.open('Delete failed', 'Close', { duration: 3000 });
          },
        });
      } else {
        // Update entry
        this.ts.updateEntry(cell.entryId, { hours, remarks: row.remarks || undefined }).subscribe({
          next: (updated) => {
            cell.hours = updated.hours;
            cell.isSaving = false;
          },
          error: () => {
            cell.isSaving = false;
            this.snack.open('Update failed', 'Close', { duration: 3000 });
          },
        });
      }
    } else {
      if (hours == null || hours <= 0) {
        cell.isSaving = false;
        return;
      }
      // Add new entry
      this.ts.addEntry({
        project_id: projectId,
        entry_date: row.date,
        hours,
        remarks: row.remarks || undefined,
      }).subscribe({
        next: (saved) => {
          cell.entryId = saved.entry_id;
          cell.hours = saved.hours;
          cell.isSaving = false;
          this.snack.open('Saved', undefined, { duration: 1500 });
        },
        error: (err) => {
          cell.isSaving = false;
          const msg = err?.error?.detail ?? 'Failed to save';
          this.snack.open(msg, 'Close', { duration: 4000 });
        },
      });
    }
  }

  markRemarksDirty(row: DayRow): void {
    row.remarksDirty = true;
  }

  saveRemarks(row: DayRow): void {
    if (!row.remarksDirty) return;
    row.remarksDirty = false;

    // Find all cells for this day that have a saved entry
    const updates = this.projects
      .map((p) => row.cells[this.cellKey(p.project_id)])
      .filter((c) => c.entryId != null);

    if (updates.length === 0) return; // No entries yet, remarks will be included on next save

    row.remarksSaving = true;
    let pending = updates.length;
    for (const cell of updates) {
      this.ts.updateEntry(cell.entryId!, { hours: cell.hours!, remarks: row.remarks || undefined }).subscribe({
        next: () => { if (--pending === 0) row.remarksSaving = false; },
        error: () => { row.remarksSaving = false; this.snack.open('Remarks save failed', 'Close', { duration: 3000 }); },
      });
    }
  }

  getProjectTotal(projectId: number): number {
    const key = this.cellKey(projectId);
    return this.dayRows.reduce((sum, row) => sum + (row.cells[key]?.hours ?? 0), 0);
  }

  get monthlyTotal(): number {
    return this.dayRows.reduce((sum, row) =>
      sum + this.projects.reduce((s, p) => s + (row.cells[this.cellKey(p.project_id)]?.hours ?? 0), 0), 0);
  }
}
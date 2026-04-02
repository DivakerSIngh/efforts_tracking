import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportService } from '../report';
import { AuthService } from '../../core/auth';
import { CandidateReportRow } from '../../core/models';

interface ReportGroup {
  candidateId: number;
  candidateName: string;
  email: string;
  hourlyRate: number;
  fixedAmount: number;
  totalHours: number;
  totalAmount: number;
  projectsSummary: string;
  projects: { name: string; hours: number }[];
}

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatCardModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './report-view.html',
  styleUrl: './report-view.scss',
})
export class ReportView implements OnInit, AfterViewInit {

  @ViewChild(MatSort)      sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = false;
  searchQuery = '';
  dataSource = new MatTableDataSource<ReportGroup>([]);
  displayedColumns = ['candidateName', 'assignedProjects', 'email', 'hourlyRate', 'fixedAmount', 'totalHours', 'totalAmount'];

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString('default', { month: 'long' }) }));
  years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  selectedMonth = new Date().getMonth() + 1;
  selectedYear  = new Date().getFullYear();
  exporting = false;

  get isAdmin(): boolean { return this.auth.getRole() === 'admin'; }
  get grandTotalHours(): number { return this.dataSource.data.reduce((s, g) => s + g.totalHours, 0); }
  get grandTotalAmount(): number { return this.dataSource.data.reduce((s, g) => s + g.totalAmount, 0); }

  constructor(private rs: ReportService, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this.dataSource.sort      = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  load(): void {
    this.loading = true;
    this.rs.getReport(this.selectedMonth, this.selectedYear).subscribe({
      next: (rows) => {
        this.dataSource.data = this.groupRows(rows);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private groupRows(rows: CandidateReportRow[]): ReportGroup[] {
    const map = new Map<number, { group: ReportGroup; projectItems: { name: string; hours: number }[] }>();
    for (const r of rows) {
      if (!map.has(r.candidate_id)) {
        map.set(r.candidate_id, {
          group: {
            candidateId:     r.candidate_id,
            candidateName:   r.candidate_name,
            email:           r.email,
            hourlyRate:      r.hourly_rate,
            fixedAmount:     r.fixed_amount,
            totalHours:      0,
            totalAmount:     0,
            projectsSummary: '',
            projects:        [],
          },
          projectItems: [],
        });
      }
      const entry = map.get(r.candidate_id)!;
      entry.group.totalHours += r.total_hours;
      entry.projectItems.push({ name: r.project_name, hours: r.total_hours });
    }
    return Array.from(map.values()).map(({ group, projectItems }) => {
      // Recalculate amount based on aggregated hours
      const totalAmount = group.totalHours * group.hourlyRate + group.fixedAmount;
      return {
        ...group,
        totalAmount: totalAmount,
        projects: projectItems,
        projectsSummary: projectItems.map(p => `${p.name} (${p.hours}h)`).join(' · '),
      };
    });
  }

  exportExcel(): void {
    this.exporting = true;
    this.rs.exportExcel(this.selectedMonth, this.selectedYear).subscribe({
      next: (blob) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `report-${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
        this.snack.open('Export failed', 'Close', { duration: 3000 });
      },
    });
  }

  getMonthLabel(m: number): string {
    return new Date(2000, m - 1).toLocaleString('default', { month: 'long' });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.dataSource.filterPredicate = (row: ReportGroup) =>
      !q ||
      row.candidateName?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q);
    this.dataSource.filter = q ? q : '';
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  resetFilter(): void {
    this.searchQuery = '';
    this.dataSource.filter = '';
    this.selectedMonth = new Date().getMonth() + 1;
    this.selectedYear  = new Date().getFullYear();
    this.load();
  }
}

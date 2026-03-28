import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../admin';
import {
  Chart,
  BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface ProjectReport {
  project_id: number;
  project_name: string;
  total_candidates: number;
  total_hours: number;
  candidate_amount: number;
  project_amount: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('projectChartRef') projectChartRef!: ElementRef<HTMLCanvasElement>;

  loading = false;
  projectData: ProjectReport[] = [];
  totalHours = 0;
  totalAmount = 0;

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString('default', { month: 'long' }) }));
  years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  selectedMonth = new Date().getMonth() + 1;
  selectedYear  = new Date().getFullYear();

  private projectChart: Chart | null = null;
  private chartsReady = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (this.projectData.length) {
      setTimeout(() => this.renderProjectChart(), 100);
    }
  }

  ngOnDestroy(): void {
    this.projectChart?.destroy();
  }

  load(): void {
    this.loading = true;
    this.adminService.getAdminProjectReport(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.projectData = data;
        this.calculateTotals();
        this.loading = false;
        if (this.chartsReady) {
          setTimeout(() => this.renderProjectChart(), 50);
        }
      },
      error: () => { this.loading = false; },
    });
  }

  private calculateTotals(): void {
    this.totalHours = this.projectData.reduce((sum, p) => sum + p.total_hours, 0);
    this.totalAmount = this.projectData.reduce((sum, p) => sum + p.candidate_amount, 0);
  }

  onFilterChange(): void { this.load(); }

  resetFilter(): void {
    this.selectedMonth = new Date().getMonth() + 1;
    this.selectedYear  = new Date().getFullYear();
    this.load();
  }

  getMonthName(m: number): string {
    return new Date(2000, m - 1).toLocaleString('default', { month: 'long' });
  }

  private renderProjectChart(): void {
    if (!this.projectChartRef || !this.projectData.length) return;

    const labels = this.projectData.map(p => p.project_name);
    const candidateAmounts = this.projectData.map(p => p.candidate_amount);
    const projectAmounts = this.projectData.map(p => p.project_amount);

    if (this.projectChart) {
      this.projectChart.data.labels = labels;
      (this.projectChart.data.datasets[0] as any).data = candidateAmounts;
      (this.projectChart.data.datasets[1] as any).data = projectAmounts;
      this.projectChart.update('active');
      return;
    }

    this.projectChart = new Chart(this.projectChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Candidate Amount',
            data: candidateAmounts,
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderColor: '#4f46e5',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
          },
          {
            label: 'Project Amount',
            data: projectAmounts,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#059669',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#6b7280', font: { size: 12 }, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                let label = ctx.dataset.label || '';
                if (label) label += ': ';
                if (ctx.parsed?.y) label += '₹' + ctx.parsed.y.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#6b7280', font: { size: 11 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#6b7280', font: { size: 11 } },
          },
        },
      },
    });
  }
}

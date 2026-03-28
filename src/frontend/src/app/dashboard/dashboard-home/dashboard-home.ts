import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardService } from '../dashboard';
import { DashboardSummary, MonthlyTrend } from '../../core/models';
import {
  Chart,
  BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, ArcElement,
} from 'chart.js';
import { AuthService } from '../../core/auth';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

interface ProjectReport {
  project_id: number;
  project_name: string;
  total_candidates: number;
  total_hours: number;
  candidate_amount: number;
  project_amount: number;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss',
})
export class DashboardHome implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('monthlyChartRef') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectChartRef') projectChartRef!: ElementRef<HTMLCanvasElement>;

  loading = false;
  summary: DashboardSummary | null = null;
  trend: MonthlyTrend[] = [];
  projectData: ProjectReport[] = [];
  
  auth = inject(AuthService);

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString('default', { month: 'long' }) }));
  years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  selectedMonth = new Date().getMonth() + 1;
  selectedYear  = new Date().getFullYear();

  totalHours = 0;
  totalAmount = 0;

  private monthlyChart: Chart | null = null;
  private projectChart: Chart | null = null;
  private chartsReady = false;

  private readonly palette = [
    '#6366f1','#8b5cf6','#06b6d4','#10b981',
    '#f59e0b','#ef4444','#ec4899','#14b8a6',
  ];

  get isAdmin(): boolean {  
    return this.auth.getRole() === 'admin'; }
  
  get totalPaymentLabel(): string {
    return this.summary ? this.summary.total_payment.toFixed(2) : '0.00';
  }

  constructor(private ds: DashboardService) {}

  ngOnInit(): void {
    
    this.load();
    this.isAdmin
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    // Delay rendering to ensure DOM is fully ready
    setTimeout(() => {
      if (this.isAdmin) {
        if (this.projectData.length) this.renderProjectChart();
      } else {
        if (this.trend.length) this.renderMonthlyChart();
        if (this.summary?.project_breakdown?.length) this.renderProjectChart();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.monthlyChart?.destroy();
    this.projectChart?.destroy();
  }

  load(): void {
    this.loading = true;
    this.ds.getSummary(this.selectedMonth, this.selectedYear).subscribe({
      next: (data: any) => {
        if (this.isAdmin) {
          // Admin: data is array of projects
          this.projectData = data as ProjectReport[];
          this.calculateAdminTotals();
        } else {
          // Candidate: data is summary object
          this.summary = data as DashboardSummary;
        }
        this.loading = false;
        if (this.chartsReady) {
          if (this.isAdmin) {
            setTimeout(() => this.renderProjectChart(), 50);
          } else {
            setTimeout(() => this.renderProjectChart(), 50);
          }
        }
      },
      error: () => { this.loading = false; },
    });
    
    // Only load trend for candidates
    if (!this.isAdmin) {
      this.ds.getYearlyTrend(this.selectedYear).subscribe({
        next: (t) => {
          this.trend = t;
          if (this.chartsReady) {
            setTimeout(() => this.renderMonthlyChart(), 50);
          }
        },
      });
    }
  }

  private calculateAdminTotals(): void {
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

  private renderMonthlyChart(): void {
    if (!this.monthlyChartRef) return;
    // Show abbreviated month names for yearly view
    const labels = this.trend.map(t =>
      new Date(t.year, t.month - 1).toLocaleString('default', { month: 'short' })
    );
    const data = this.trend.map(t => t.total_hours);

    if (this.monthlyChart) {
      this.monthlyChart.data.labels = labels;
      (this.monthlyChart.data.datasets[0] as any).data = data;
      this.monthlyChart.update('active');
      return;
    }

    this.monthlyChart = new Chart(this.monthlyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Hours',
          data,
          backgroundColor: 'rgba(99,102,241,0.75)',
          borderColor: '#4f46e5',
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(99,102,241,1)',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed?.y} hrs` } },
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

  private renderProjectChart(): void {
    if (!this.projectChartRef) return;

    if (this.isAdmin) {
      // Admin: grouped bar chart with candidate_amount vs project_amount
      if (!this.projectData.length) return;
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
              backgroundColor: 'rgba(59,130,246,0.75)',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Project Amount',
              data: projectAmounts,
              backgroundColor: 'rgba(16,185,129,0.75)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#6b7280', font: { size: 12 }, padding: 14 },
            },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ₹${ctx.parsed?.y?.toFixed(2)}`,
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
    } else {
      // Candidate: doughnut chart with hours by project
      if (!this.summary?.project_breakdown?.length) return;
      const labels = this.summary.project_breakdown.map(p => p.project_name);
      const data   = this.summary.project_breakdown.map(p => p.hours);
      const colors = this.palette.slice(0, data.length);

      if (this.projectChart) {
        this.projectChart.data.labels = labels;
        (this.projectChart.data.datasets[0] as any).data = data;
        (this.projectChart.data.datasets[0] as any).backgroundColor = colors;
        this.projectChart.update('active');
        return;
      }

      this.projectChart = new Chart(this.projectChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 10,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#6b7280', font: { size: 11 }, padding: 14, boxWidth: 12 },
            },
            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} hrs` } },
          },
          cutout: '68%',
        },
      });
    }
  }
}

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

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

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString('default', { month: 'long' }) }));
  years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  selectedMonth = new Date().getMonth() + 1;
  selectedYear  = new Date().getFullYear();

  private monthlyChart: Chart | null = null;
  private projectChart: Chart | null = null;
  private chartsReady = false;

  private readonly palette = [
    '#6366f1','#8b5cf6','#06b6d4','#10b981',
    '#f59e0b','#ef4444','#ec4899','#14b8a6',
  ];

  get totalPaymentLabel(): string {
    return this.summary ? this.summary.total_payment.toFixed(2) : '0.00';
  }

  constructor(private ds: DashboardService) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (this.trend.length)                        this.renderMonthlyChart();
    if (this.summary?.project_breakdown?.length)  this.renderProjectChart();
  }

  ngOnDestroy(): void {
    this.monthlyChart?.destroy();
    this.projectChart?.destroy();
  }

  load(): void {
    this.loading = true;
    this.ds.getSummary(this.selectedMonth, this.selectedYear).subscribe({
      next: (s) => {
        this.summary = s;
        this.loading = false;
        if (this.chartsReady) this.renderProjectChart();
      },
      error: () => { this.loading = false; },
    });
    this.ds.getTrend(12).subscribe({
      next: (t) => {
        this.trend = t;
        if (this.chartsReady) this.renderMonthlyChart();
      },
    });
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
    const labels = this.trend.map(t =>
      new Date(t.year, t.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
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
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} hrs` } },
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
    if (!this.projectChartRef || !this.summary?.project_breakdown?.length) return;
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

import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { roleGuard } from './core/role-guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard-module').then(m => m.DashboardModule),
      },
      {
        path: 'timesheet',
        loadChildren: () => import('./timesheet/timesheet-module').then(m => m.TimesheetModule),
      },
      {
        path: 'report',
        loadChildren: () => import('./report/report-module').then(m => m.ReportModule),
      },
      {
        path: 'profile',
        canActivate: [roleGuard],
        data: { role: 'candidate' },
        loadComponent: () => import('./admin/profile/profile').then(m => m.ProfileComponent),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { role: 'admin' },
        loadChildren: () => import('./admin/admin-module').then(m => m.AdminModule),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

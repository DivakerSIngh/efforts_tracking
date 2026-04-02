import { Component, Input, Output, EventEmitter, Inject, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { TokenStorageService } from '../../core/token-storage';
import { AuthService } from '../../core/auth';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  role?: string;
  color: string;
  iconBg: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  authService = inject(AuthService );
  navItems: NavItem[] = [
    {
      label: 'Dashboard', icon: 'dashboard', route: '/dashboard',
      color: '#6366f1', iconBg: '#eef2ff'
    },
    {
      label: 'Timesheet', icon: 'access_time', route: '/timesheet',
      role: 'candidate', color: '#10b981', iconBg: '#ecfdf5'
    },
    {
      label: 'My Profile', icon: 'person', route: '/profile',
      role: 'candidate', color: '#f472b6', iconBg: '#fdf2f8'
    },
    {
      label: 'Reports', icon: 'bar_chart', route: '/report',
      color: '#f59e0b', iconBg: '#fffbeb'
    },
    {
      label: 'Admin', icon: 'admin_panel_settings', route: '/admin',
      role: 'admin', color: '#8b5cf6', iconBg: '#f5f3ff',
      children: [
        { label: 'Projects',   icon: 'folder_special', route: '/admin/projects',   color: '#8b5cf6', iconBg: '#f5f3ff' },
        { label: 'Candidates', icon: 'group',          route: '/admin/candidates', color: '#06b6d4', iconBg: '#ecfeff' },
      ]
    },
  ];

  constructor(private tokenStorage: TokenStorageService) {}

  get visibleItems(): NavItem[] {
    const role = this.authService.getCurrentUser()?.role;// || this.tokenStorage.getUser()?.role;
    return this.navItems.filter(item => !item.role || item.role === role);
  }
}

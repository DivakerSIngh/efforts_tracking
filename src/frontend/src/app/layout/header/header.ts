import { Component, EventEmitter, Output } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Output() menuToggle = new EventEmitter<void>();

  pageTitle = 'Dashboard';

  private routeTitleMap: Record<string, string> = {
    '/dashboard':          'Dashboard',
    '/timesheet':          'Timesheet',
    '/report':             'Reports',
    '/admin':              'Admin',
    '/admin/projects':     'Projects',
    '/admin/candidates':   'Candidates',
    '/admin/assignments':  'Assignments',
  };

  constructor(public authService: AuthService, private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.pageTitle = this.routeTitleMap[e.urlAfterRedirects] || 'Effort Tracker';
    });
  }

  get initials(): string {
    const name = this.authService.getCurrentUser()?.full_name ?? '';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}


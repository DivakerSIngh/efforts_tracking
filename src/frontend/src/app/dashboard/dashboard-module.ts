import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing-module';
import { DashboardHome } from './dashboard-home/dashboard-home';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardHome,
  ]
})
export class DashboardModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportRoutingModule } from './report-routing-module';
import { ReportView } from './report-view/report-view';

@NgModule({
  imports: [
    CommonModule,
    ReportRoutingModule,
    ReportView,
  ]
})
export class ReportModule { }

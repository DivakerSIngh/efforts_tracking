import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetRoutingModule } from './timesheet-routing-module';
import { TimesheetEntry } from './timesheet-entry/timesheet-entry';

@NgModule({
  imports: [
    CommonModule,
    TimesheetRoutingModule,
    TimesheetEntry,
  ]
})
export class TimesheetModule { }

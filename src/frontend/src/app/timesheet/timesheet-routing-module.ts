import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimesheetEntry } from './timesheet-entry/timesheet-entry';

const routes: Routes = [
  { path: '', component: TimesheetEntry },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimesheetRoutingModule { }

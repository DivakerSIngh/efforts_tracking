import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportView } from './report-view/report-view';

const routes: Routes = [
  { path: '', component: ReportView },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }

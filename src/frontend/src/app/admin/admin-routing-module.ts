import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboard } from './dashboard/admin-dashboard';
import { Projects }   from './projects/projects';
import { Candidates } from './candidates/candidates';
import { CandidateTimesheetView } from './candidates/candidate-timesheet-view';

const routes: Routes = [
  { path: '',           component: AdminDashboard },
  { path: 'projects',   component: Projects   },
  { path: 'candidates', component: Candidates },
  { path: 'candidates/:id/timesheet', component: CandidateTimesheetView },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

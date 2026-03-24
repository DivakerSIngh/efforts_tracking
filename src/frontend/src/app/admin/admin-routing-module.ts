import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Projects }   from './projects/projects';
import { Candidates } from './candidates/candidates';
import { CandidateTimesheetView } from './candidates/candidate-timesheet-view';

const routes: Routes = [
  { path: '',           redirectTo: 'projects', pathMatch: 'full' },
  { path: 'projects',   component: Projects   },
  { path: 'candidates', component: Candidates },
  { path: 'candidates/:id/timesheet', component: CandidateTimesheetView },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

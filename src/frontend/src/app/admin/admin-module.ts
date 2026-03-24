import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing-module';
import { Projects }   from './projects/projects';
import { Candidates } from './candidates/candidates';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    Projects,
    Candidates,
  ]
})
export class AdminModule { }

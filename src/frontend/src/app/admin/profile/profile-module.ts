import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from './profile';

@NgModule({
  imports: [CommonModule, FormsModule, ProfileComponent],
})
export class ProfileModule {}

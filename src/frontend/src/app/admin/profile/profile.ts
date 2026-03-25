import { Component, OnInit } from '@angular/core';
import { CandidateService } from '../../core/candidate.service';
import { Candidate, CandidateUpdate } from '../../core/models';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [CommonModule,
    FormsModule,
    MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressBarModule,
    MatTooltipModule, MatDialogModule,]
})
export class ProfileComponent implements OnInit {
  candidate: Candidate | undefined;
  success = false;
  error = false;

  constructor(private candidateService: CandidateService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.candidateService.getMyProfile().subscribe({
      next: (data) => { this.candidate = data; },
      error: () => { this.error = true; }
    });
  }

  onSubmit() {
    if (!this.candidate) return;
    const update: CandidateUpdate = {
      phone: this.candidate.phone,
      hourly_rate: this.candidate.hourly_rate,
      fixed_amount: this.candidate.fixed_amount,
      account_no: this.candidate.account_no,
      ifsc_code: this.candidate.ifsc_code
    };
    this.candidateService.updateMyProfile(update).subscribe({
      next: (data) => {
        this.candidate = data;
        this.success = true;
        this.error = false;
      },
      error: () => {
        this.success = false;
        this.error = true;
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = '';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      this.errorMessage = 'ลิงก์ยืนยันไม่ถูกต้อง กรุณาสมัครสมาชิกใหม่';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
        setTimeout(() => this.router.navigate(['/summary']), 2500);
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage =
          err?.error ??
          'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว กรุณาสมัครสมาชิกใหม่';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form = new FormGroup({
    userName: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rememberMe: new FormControl(false),
  });
  isSubmitting = false;
  errorMessage = '';

  private readonly toast = inject(ToastService);

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  get userName() {
    return this.form.controls.userName;
  }

  get password() {
    return this.form.controls.password;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const payload = {
      userName: this.userName.value ?? '',
      password: this.password.value ?? '',
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('เข้าสู่ระบบสำเร็จ');
        this.router.navigate(['/history']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error ?? 'Login failed. Please check username and password.';
        this.toast.error(this.errorMessage, { detail: JSON.stringify(error?.error ?? error?.message, null, 2) });
      },
    });
  }
}

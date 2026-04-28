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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    userName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
  });
  isSubmitting = false;
  errorMessage = '';

  private readonly toast = inject(ToastService);

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  get fullName() {
    return this.form.controls.fullName;
  }

  get email() {
    return this.form.controls.email;
  }

  get userName() {
    return this.form.controls.userName;
  }

  get password() {
    return this.form.controls.password;
  }

  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  get isPasswordMismatch(): boolean {
    return (
      this.password.value !== this.confirmPassword.value &&
      this.confirmPassword.touched
    );
  }

  onSubmit() {
    if (
      this.form.invalid ||
      this.password.value !== this.confirmPassword.value
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const payload = {
      name: this.fullName.value ?? '',
      userName: this.userName.value ?? '',
      email: this.email.value ?? '',
      password: this.password.value ?? '',
    };

    this.authService.register(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        const requiresVerification =
          response?.emailVerificationRequired ?? true;
        const message =
          response?.message ??
          (requiresVerification
            ? 'สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลของคุณ'
            : 'สมัครสมาชิกสำเร็จ สามารถเข้าสู่ระบบได้ทันที');
        this.toast.success(message);
        this.router.navigate([requiresVerification ? '/email-sent' : '/login']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error ?? 'Register failed. Please check your information.';
        this.toast.error(this.errorMessage, {
          detail: JSON.stringify(error?.error ?? error?.message, null, 2),
        });
      },
    });
  }
}

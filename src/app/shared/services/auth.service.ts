import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface RegisterRequest {
  name: string;
  userName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly tokenKey = 'token';

  private get baseUrl(): string {
    return this.appConfig.getApiBaseUrl();
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/register`;
    return this.http
      .post<AuthResponse>(url, payload)
      .pipe(tap((response) => this.setToken(response.token)));
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/login`;
    return this.http
      .post<AuthResponse>(url, payload)
      .pipe(tap((response) => this.setToken(response.token)));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}
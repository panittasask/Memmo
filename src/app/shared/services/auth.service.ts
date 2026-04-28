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
  refreshToken?: string;
  message: string;
}

export interface RegisterResponse {
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly tokenKey = 'token';
  private readonly refreshTokenKey = 'refreshToken';

  private get baseUrl(): string {
    return this.appConfig.getApiBaseUrl();
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    const url = `${this.baseUrl}/Auth/register`;
    return this.http.post<RegisterResponse>(url, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/login`;
    return this.http
      .post<AuthResponse>(url, payload)
      .pipe(tap((response) => this.setAuthTokens(response)));
  }

  verifyEmail(token: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/verify-email?token=${encodeURIComponent(token)}`;
    return this.http
      .get<AuthResponse>(url)
      .pipe(tap((response) => this.setAuthTokens(response)));
  }

  refreshToken(): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/refresh-token`;
    const payload: RefreshTokenRequest = {
      refreshToken: this.getRefreshToken() ?? '',
    };

    return this.http
      .post<AuthResponse>(url, payload)
      .pipe(tap((response) => this.setAuthTokens(response)));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isTokenValid(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    const exp = this.getTokenExp(token);
    if (!exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return exp > nowInSeconds;
  }

  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  clearToken(): void {
    this.clearAuth();
  }

  private setAuthTokens(response: AuthResponse): void {
    this.setToken(response.token);

    if (response.refreshToken) {
      this.setRefreshToken(response.refreshToken);
    }
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private getTokenExp(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(normalizedPayload));
      const exp = Number(decodedPayload?.exp);

      return Number.isFinite(exp) ? exp : null;
    } catch {
      return null;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface AppConfig {
  apiBaseUrl: string;
  appName?: string;
  env?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private config: AppConfig | null = null;

  constructor(private readonly http: HttpClient) {}

  loadConfig(): Promise<void> {
    return firstValueFrom(
      this.http.get<AppConfig>('assets/config/app.config.json').pipe(
        tap((cfg) => (this.config = cfg)),
        catchError((error) => {
          console.error('Could not load configuration file', error);
          this.config = { apiBaseUrl: 'http://localhost:5065' };
          return of(this.config);
        }),
      ),
    ).then(() => void 0);
  }

  getApiBaseUrl(): string {
    return this.config?.apiBaseUrl || 'http://localhost:5065';
  }
}

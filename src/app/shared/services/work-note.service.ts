import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface WorkNote {
  id?: string;
  title: string;
  detail?: string | null;
  createdDate?: string;
  updateDate?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkNoteService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  private get baseUrl(): string {
    return `${this.appConfig.getApiBaseUrl()}/WorkNote`;
  }

  getAll(): Observable<WorkNote[]> {
    return this.http.get<WorkNote[]>(this.baseUrl);
  }

  getById(id: string): Observable<WorkNote> {
    return this.http.get<WorkNote>(`${this.baseUrl}/${id}`);
  }

  create(model: WorkNote): Observable<WorkNote> {
    return this.http.post<WorkNote>(this.baseUrl, model);
  }

  update(id: string, model: WorkNote): Observable<WorkNote> {
    return this.http.put<WorkNote>(`${this.baseUrl}/${id}`, model);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';

export interface ProjectData {
  projectName: string;
  taskCount: number;
  totalDuration: number;
}

export interface StatusData {
  status: string;
  taskCount: number;
}

export interface TaskSummary {
  projectName: string;
  status: string;
  count: number;
  totalDuration: number;
}

export interface ChartDataResponse {
  projects: ProjectData[];
  statuses: StatusData[];
  tasksSummary: TaskSummary[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  private get baseUrl(): string {
    return this.appConfig.getApiBaseUrl();
  }

  getChartData(startDate: Date, endDate: Date) {
    const url = `${this.baseUrl}/Dashboard/getChartData`;
    return this.http.post<ChartDataResponse>(url, {
      StartDate: startDate,
      EndDate: endDate,
    });
  }
}

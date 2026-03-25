import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { BarChartComponent, ChartDataPoint } from '../../shared/components/bar-chart/bar-chart.component';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';
import { ChartDataResponse, DashboardService, ProjectData, StatusData } from '../../shared/services/dashboard.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BarChartComponent, DropdownListComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);

  readonly periodOptions = ['สัปดาห์', 'เดือน'];
  selectedPeriod = 'สัปดาห์';
  isLoading = false;

  projects: ProjectData[] = [];
  statuses: StatusData[] = [];

  get projectDurationChart(): ChartDataPoint[] {
    return this.projects.map(p => ({ label: p.projectName ?? '(ไม่ระบุ)', value: p.totalDuration }));
  }

  get projectTaskChart(): ChartDataPoint[] {
    return this.projects.map(p => ({ label: p.projectName ?? '(ไม่ระบุ)', value: p.taskCount }));
  }

  get statusChart(): ChartDataPoint[] {
    return this.statuses.map(s => ({ label: s.status ?? '(ไม่ระบุ)', value: s.taskCount }));
  }

  get totalDuration(): number {
    return this.projects.reduce((sum, p) => sum + p.totalDuration, 0);
  }

  get totalTasks(): number {
    return this.projects.reduce((sum, p) => sum + p.taskCount, 0);
  }

  async ngOnInit(): Promise<void> {
    await this.loadChartData();
  }

  async onPeriodChange(value: string | number): Promise<void> {
    this.selectedPeriod = String(value);
    await this.loadChartData();
  }

  private async loadChartData(): Promise<void> {
    this.isLoading = true;
    try {
      const endDate = new Date();
      const startDate = new Date();
      if (this.selectedPeriod === 'เดือน') {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate.setDate(startDate.getDate() - 6);
      }
      const res = await firstValueFrom(
        this.dashboardService.getChartData(startDate, endDate),
      );
      this.projects = res?.projects ?? [];
      this.statuses = res?.statuses ?? [];
    } catch (ex: any) {
      this.toast.error('ไม่สามารถโหลดข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
      this.projects = [];
      this.statuses = [];
    } finally {
      this.isLoading = false;
    }
  }
}

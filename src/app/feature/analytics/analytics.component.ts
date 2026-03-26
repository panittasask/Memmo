import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { BarChartComponent, ChartDataPoint } from '../../shared/components/bar-chart/bar-chart.component';
import { DonutChartComponent, DonutSlice } from '../../shared/components/donut-chart/donut-chart.component';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';
import { ChartDataResponse, DashboardService, ProjectData, StatusData } from '../../shared/services/dashboard.service';
import { HistoryService } from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BarChartComponent, DonutChartComponent, DropdownListComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly historyService = inject(HistoryService);
  private readonly toast = inject(ToastService);

  private readonly thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  readonly periodOptions = ['สัปดาห์', 'เดือน'];
  selectedPeriod = 'สัปดาห์';
  monthOptions: string[] = [];
  selectedMonth = '';
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

  get projectDurationDonut(): DonutSlice[] {
    return this.projects.map(p => ({ label: p.projectName ?? '(ไม่ระบุ)', value: p.totalDuration }));
  }

  get statusDonut(): DonutSlice[] {
    return this.statuses.map(s => ({ label: s.status ?? '(ไม่ระบุ)', value: s.taskCount }));
  }

  get totalDuration(): number {
    return this.projects.reduce((sum, p) => sum + p.totalDuration, 0);
  }

  get totalTasks(): number {
    return this.projects.reduce((sum, p) => sum + p.taskCount, 0);
  }

  ngOnInit(): void {
    this.buildMonthOptions().then(() => this.loadChartData());
  }

  async onPeriodChange(value: string | number): Promise<void> {
    this.selectedPeriod = String(value);
    await this.loadChartData();
  }

  async onMonthChange(value: string | number): Promise<void> {
    this.selectedMonth = String(value);
    await this.loadChartData();
  }

  private async buildMonthOptions(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.historyService.getTask({ page: 1, pageSize: 9999, isAllFilter: true }),
      );
      const items: any[] = Array.isArray(result) ? result : (result as any)?.items ?? [];
      const seen = new Set<string>();
      const months: string[] = [];
      for (const item of items) {
        const d = new Date(item.startDate);
        if (isNaN(d.getTime())) continue;
        const key = `${this.thaiMonths[d.getMonth()]} ${d.getFullYear()}`;
        if (!seen.has(key)) {
          seen.add(key);
          months.push(key);
        }
      }
      months.sort((a, b) => {
        const pa = a.split(' ');
        const pb = b.split(' ');
        const ya = parseInt(pa[1], 10);
        const yb = parseInt(pb[1], 10);
        if (ya !== yb) return yb - ya;
        return this.thaiMonths.indexOf(pb[0]) - this.thaiMonths.indexOf(pa[0]);
      });
      this.monthOptions = months.length ? months : [`${this.thaiMonths[new Date().getMonth()]} ${new Date().getFullYear()}`];
    } catch {
      const now = new Date();
      this.monthOptions = [`${this.thaiMonths[now.getMonth()]} ${now.getFullYear()}`];
    }
    this.selectedMonth = this.monthOptions[0];
  }

  private async loadChartData(): Promise<void> {
    this.isLoading = true;
    try {
      let startDate: Date;
      let endDate: Date;

      if (this.selectedPeriod === 'เดือน') {
        const parts = this.selectedMonth.split(' ');
        const year = parseInt(parts[1], 10);
        const monthIndex = this.thaiMonths.indexOf(parts[0]);
        startDate = new Date(year, monthIndex, 1);
        endDate = new Date(year, monthIndex + 1, 0);
      } else {
        endDate = new Date();
        startDate = new Date();
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

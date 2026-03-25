import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DonutChartComponent, DonutSlice } from '../../shared/components/donut-chart/donut-chart.component';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';
import { DashboardService } from '../../shared/services/dashboard.service';
import { HistoryService } from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, DonutChartComponent, DropdownListComponent],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly historyService = inject(HistoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly periodOptions = ['สัปดาห์', 'เดือน'];
  selectedPeriod = 'สัปดาห์';
  isLoading = false;

  statusSlices: DonutSlice[] = [];
  projectSlices: DonutSlice[] = [];
  projectTaskSlices: DonutSlice[] = [];
  recentTasks: any[] = [];

  get totalTasks(): number {
    return this.statusSlices.reduce((s, d) => s + d.value, 0);
  }

  get totalDuration(): number {
    return this.projectSlices.reduce((s, d) => s + d.value, 0);
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadRecentTasks()]);
  }

  async onPeriodChange(value: string | number): Promise<void> {
    this.selectedPeriod = String(value);
    await this.load();
  }

  goToHistory(): void {
    this.router.navigate(['history']);
  }

  goToSettings(): void {
    this.router.navigate(['settings']);
  }

  goToAnalytics(): void {
    this.router.navigate(['analytics']);
  }

  private async load(): Promise<void> {
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
      this.statusSlices = (res?.statuses ?? []).map(s => ({ label: s.status ?? '(ไม่ระบุ)', value: s.taskCount }));
      this.projectSlices = (res?.projects ?? []).map(p => ({ label: p.projectName ?? '(ไม่ระบุ)', value: p.totalDuration }));
      this.projectTaskSlices = (res?.projects ?? []).map(p => ({ label: p.projectName ?? '(ไม่ระบุ)', value: p.taskCount }));
    } catch (ex: any) {
      this.toast.error('ไม่สามารถโหลดข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
      this.statusSlices = [];
      this.projectSlices = [];
      this.projectTaskSlices = [];
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRecentTasks(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.historyService.getTask({ page: 1, pageSize: 8, isAllFilter: true }),
      );
      const items = Array.isArray(res) ? res : (res as any)?.items ?? [];
      this.recentTasks = items;
    } catch {
      this.recentTasks = [];
    }
  }
}

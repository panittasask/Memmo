import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DonutChartComponent, DonutSlice } from '../../shared/components/donut-chart/donut-chart.component';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';
import { DashboardService } from '../../shared/services/dashboard.service';
import { HistoryService } from '../../shared/services/history.service';
import { SettingsService } from '../../shared/services/settings.service';
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
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private statusColorMap = new Map<string, string>();

  private readonly thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  readonly periodOptions = ['สัปดาห์', 'เดือน'];
  selectedPeriod = 'สัปดาห์';
  monthOptions: string[] = [];
  selectedMonth = '';
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

  ngOnInit(): void {
    Promise.all([this.buildMonthOptions(), this.loadRecentTasks(), this.loadStatusColors()]).then(() => this.load());
  }

  async onPeriodChange(value: string | number): Promise<void> {
    this.selectedPeriod = String(value);
    await this.load();
  }

  async onMonthChange(value: string | number): Promise<void> {
    this.selectedMonth = String(value);
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

  getStatusColor(status: string): string {
    return this.statusColorMap.get(status?.toLowerCase()) ?? '';
  }

  private async loadStatusColors(): Promise<void> {
    try {
      const res = await firstValueFrom(this.settingsService.getSettings());
      const parents = res.parents ?? [];
      const children = res.children ?? [];
      const statusParent = parents.find(p => p.key === 'status');
      if (statusParent) {
        children
          .filter(c => c.parentId === statusParent.id && c.color)
          .forEach(c => this.statusColorMap.set(c.name.toLowerCase(), c.color!));
      }
    } catch {
      // ignore — colors are optional
    }
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
        if (!seen.has(key)) { seen.add(key); months.push(key); }
      }
      months.sort((a, b) => {
        const pa = a.split(' '), pb = b.split(' ');
        const ya = parseInt(pa[1], 10), yb = parseInt(pb[1], 10);
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

  private async load(): Promise<void> {
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

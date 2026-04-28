import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import {
  GridItemComponent,
  GridPageChangeEvent,
} from '../../shared/components/grid-item/grid-item.component';
import {
  HistoryPagedResult,
  HistoryQueryRequest,
  HistoryService,
} from '../../shared/services/history.service';
import { firstValueFrom } from 'rxjs';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatepickerComponent } from '../../shared/components/datepicker/datepicker.component';
import { ColumnSettings } from '../../shared/models/column-settings.model';
import { ToastService } from '../../shared/services/toast.service';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';
import {
  DropdownChildItem,
  SettingsService,
} from '../../shared/services/settings.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ActivatedRoute, Router } from '@angular/router';

interface HistoryItem {
  id: string;
  startDate: string;
  taskName: string;
  projectName: string;
  status: string;
  duration: number;
  description?: string;
  hyperlink?: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    GridItemComponent,
    ReactiveFormsModule,
    FormsModule,
    DatepickerComponent,
    DropdownListComponent,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  private readonly HistoryService = inject(HistoryService);
  private readonly toast = inject(ToastService);
  private readonly settingsService = inject(SettingsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private requestedTaskId: string | null = null;

  saveInProcess: boolean = false;
  selectedStatus = 'ทั้งหมด';

  projectOptions: DropdownChildItem[] = [];
  statusOptions: DropdownChildItem[] = [];

  get projectOptionNames(): string[] {
    return this.projectOptions.map((o) => o.name);
  }

  get statusOptionNames(): string[] {
    return this.statusOptions.map((o) => o.name);
  }

  get statusFilterOptions(): string[] {
    return ['ทั้งหมด', ...this.statusOptionNames];
  }
  formUpdate = new FormGroup({
    id: new FormControl('', [Validators.required]),
    date: new FormControl('', [Validators.required]),
    time: new FormControl(0),
    description: new FormControl(''),
    projectName: new FormControl('', [Validators.required]),
    taskName: new FormControl('', [Validators.required]),
    status: new FormControl(''),
    hyperlink: new FormControl(''),
    isFocusTask: new FormControl(false),
  });

  constructor() {
    effect(() => {
      if (this.HistoryService.refreshTrigger() > 0) {
        this.fetchData();
      }
    });
  }
  public selectedData: object = {};
  public isShowDetail = false;
  public filterDate = this.getToday();
  public isAllFilter = false;
  public columns: ColumnSettings[] = [
    {
      field: 'startDate',
      text: 'วันที่',
      type: 'date',
      width: 80,
    },
    {
      field: 'taskName',
      type: 'text',
      text: 'งาน',
      width: 280,
    },
    {
      field: 'projectName',
      type: 'text',
      text: 'โปรเจกต์',
      width: 100,
    },
    {
      field: 'status',
      type: 'text',
      text: 'สถานะ',
      width: 80,
    },
    {
      field: 'duration',
      type: 'number',
      text: 'ระยะเวลา',
      width: 80,
    },
    {
      field: 'hyperlink',
      type: 'hyperlink',
      text: 'ลิงค์',
      width: 100,
    },
    {
      type: 'action',
      text: 'จัดการ',
      width: 80,
    },
  ];
  public data: HistoryItem[] = [];
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100];
  currentPage = 1;
  totalPages = 1;
  totalCount: number | null = null;
  hasNextPage = false;

  selectedItem(item: any) {
    this.formUpdate.patchValue({
      id: item.id,
      date: this.getDate(item.startDate),
      description: item.description,
      time: item.duration,
      projectName: item.projectName,
      taskName: item.taskName,
      status: item.status,
      hyperlink: item.hyperlink || '',
      isFocusTask:
        String(item.nameType ?? '')
          .trim()
          .toLowerCase() === 'important',
    });
    this.selectedData = item;
    this.isShowDetail = true;
  }
  async fetchData() {
    try {
      const request: HistoryQueryRequest = {
        page: this.currentPage,
        pageSize: this.pageSize,
        filterDate: this.filterDate,
        isAllFilter: this.isAllFilter,
        status:
          this.selectedStatus !== 'ทั้งหมด' ? this.selectedStatus : undefined,
      };

      const response = await firstValueFrom(
        this.HistoryService.getTask(request),
      );
      const normalized = this.normalizePagedResponse(response);
      this.data = normalized.items;
      this.currentPage = normalized.currentPage;
      this.totalPages = normalized.totalPages;
      this.totalCount = normalized.totalCount;
      this.hasNextPage = normalized.hasNextPage;
      this.pageSize = normalized.pageSize;
      this.tryOpenRequestedTask();
    } catch (ex: any) {
      this.toast.error('ไม่สามารถโหลดข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
      console.log('Error >>', ex);
    }
  }

  onStatusFilterChange(value: string | number): void {
    this.selectedStatus = String(value || 'ทั้งหมด');
    this.currentPage = 1;
    this.fetchData();
  }

  onFilterDateChange(value: string) {
    this.isAllFilter = false;
    this.filterDate = value || this.getToday();
    this.currentPage = 1;
    this.fetchData();
  }

  setTodayFilter() {
    this.isAllFilter = false;
    this.filterDate = this.getToday();
    this.currentPage = 1;
    this.fetchData();
  }

  setAllFilter() {
    this.isAllFilter = true;
    this.currentPage = 1;
    this.fetchData();
  }

  async onPageChange(event: GridPageChangeEvent) {
    const { page, pageSize } = event;

    const isPageSizeChanged = pageSize !== this.pageSize;
    if (isPageSizeChanged) {
      this.pageSize = pageSize;
    }

    if (page < 1 || page === this.currentPage) {
      if (isPageSizeChanged) {
        this.currentPage = 1;
        await this.fetchData();
      }
      return;
    }

    if (page > this.totalPages && !this.hasNextPage) {
      return;
    }

    this.currentPage = page;
    await this.fetchData();
  }

  ngOnInit(): void {
    this.requestedTaskId = this.route.snapshot.queryParamMap.get('taskId');
    this.loadSettings().then(() => this.fetchData());
  }

  goToWorkflowFromDetail(): void {
    const taskId = this.formUpdate.controls.id.value;
    void this.router.navigate(['/workflow'], {
      queryParams: taskId ? { taskId } : undefined,
    });
  }

  async loadSettings() {
    try {
      const res = await firstValueFrom(this.settingsService.getSettings());
      const parents = res.parents ?? [];
      const children = res.children ?? [];
      const projectParent = parents.find((p) => p.key === 'project');
      const statusParent = parents.find((p) => p.key === 'status');
      this.projectOptions = projectParent
        ? children.filter((c) => c.parentId === projectParent.id)
        : [];
      this.statusOptions = statusParent
        ? children.filter((c) => c.parentId === statusParent.id)
        : [];
    } catch {
      this.projectOptions = [];
      this.statusOptions = [];
    }
  }
  async onSave() {
    if (!this.formUpdate.valid) return;
    const value: any = this.formUpdate.getRawValue();
    const model = {
      id: value.id,
      duration: value.time,
      projectName: value.projectName,
      taskName: value.taskName,
      description: value.description,
      status: value.status,
      startDate: new Date(value.date),
      hyperlink: value.hyperlink,
      nameType: value.isFocusTask ? 'important' : null,
    };
    try {
      this.saveInProcess = true;
      const result = await firstValueFrom(
        this.HistoryService.updateTask(model),
      );
      if (result) {
        this.saveInProcess = false;
        this.toast.success('บันทึกข้อมูลสำเร็จ');
        this.isShowDetail = false;
        this.fetchData();
      }
    } catch (ex: any) {
      this.saveInProcess = false;
      this.toast.error('ไม่สามารถบันทึกข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
      console.log('Error >>>', ex);
    }
  }
  async cloneItem(item: any) {
    const model = {
      duration: 0,
      projectName: item.projectName,
      taskName: item.taskName,
      description: item.description,
      status: item.status,
      hyperlink: item.hyperlink,
      startDate: new Date(),
      taskGroupId: item.taskGroupId ?? item.id,
    };
    try {
      const result = await firstValueFrom(
        this.HistoryService.addNewTask(model),
      );
      if (result) {
        this.toast.success('คัดลอกงานไปวันนี้สำเร็จ');
        this.fetchData();
      }
    } catch (ex: any) {
      this.toast.error('ไม่สามารถคัดลอกงานได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
      console.log('Clone Error >>>', ex);
    }
  }

  async deleteItem(item: any) {
    const confirmed = await this.confirmService.confirm({
      title: 'ลบรายการ',
      message: `ต้องการลบงาน "${item.taskName}" หรือไม่?`,
      confirmText: 'ลบ',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.HistoryService.deleteTask(item.id));
      this.toast.success('ลบงานสำเร็จ');
      await this.fetchData();
    } catch (ex: any) {
      this.toast.error('ไม่สามารถลบงานได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  private getDate(date: any): string {
    const today = new Date(date);
    if (Number.isNaN(today.getTime())) {
      return '';
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getToday(): string {
    return this.getDate(new Date());
  }

  private normalizePagedResponse(
    response: HistoryPagedResult<HistoryItem> | HistoryItem[],
  ): {
    items: HistoryItem[];
    currentPage: number;
    totalPages: number;
    totalCount: number | null;
    hasNextPage: boolean;
    pageSize: number;
  } {
    if (Array.isArray(response)) {
      return {
        items: response,
        currentPage: this.currentPage,
        totalPages:
          response.length < this.pageSize
            ? this.currentPage
            : this.currentPage + 1,
        totalCount: null,
        hasNextPage: response.length === this.pageSize,
        pageSize: this.pageSize,
      };
    }

    const items = response.items ?? [];
    const currentPage =
      response.currentPage ?? response.page ?? this.currentPage;
    const totalCount =
      response.totalCount ??
      response.totalRows ??
      response.totalRecords ??
      response.rowCount ??
      null;
    const pageSize = response.pageSize ?? this.pageSize;
    const totalPages =
      response.totalPages ??
      (typeof totalCount === 'number'
        ? Math.max(1, Math.ceil(totalCount / pageSize))
        : items.length < pageSize
          ? currentPage
          : currentPage + 1);
    const hasNextPage =
      response.hasNext ??
      (typeof response.totalPages === 'number'
        ? currentPage < response.totalPages
        : items.length === pageSize);

    return {
      items,
      currentPage,
      totalPages,
      totalCount,
      hasNextPage,
      pageSize,
    };
  }

  private tryOpenRequestedTask(): void {
    if (!this.requestedTaskId) {
      return;
    }

    const item = this.data.find(
      (history) => history.id === this.requestedTaskId,
    );
    if (!item) {
      return;
    }

    this.selectedItem(item);
    this.requestedTaskId = null;
  }
}

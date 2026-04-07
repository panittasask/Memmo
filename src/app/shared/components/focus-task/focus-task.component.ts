import { CommonModule } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DatepickerComponent } from '../datepicker/datepicker.component';
import { DropdownListComponent } from '../dropdown-list/dropdown-list.component';
import { DropdownChildItem, SettingsService } from '../../services/settings.service';
import { HistoryService, HistoryQueryRequest } from '../../services/history.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-focus-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, DatepickerComponent, DropdownListComponent],
  templateUrl: './focus-task.component.html',
  styleUrl: './focus-task.component.scss',
  encapsulation:ViewEncapsulation.None,
})
export class FocusTaskComponent {
  private readonly historyService = inject(HistoryService);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);

  isLoading = false;
  isAddNew = false;
  saveInProcess = false;
  isEditMode = false;
  editingItemId = '';
  selectedStatus = 'ทั้งหมด';
  private suppressOpenFromDrag = false;

  focusTaskItems: any[] = [];
  projectOptions: DropdownChildItem[] = [];
  statusOptions: DropdownChildItem[] = [];

  formAddNew = new FormGroup({
    date: new FormControl(this.getToday(), [Validators.required]),
    time: new FormControl(0),
    description: new FormControl(''),
    projectName: new FormControl('', [Validators.required]),
    taskName: new FormControl('', [Validators.required]),
    status: new FormControl(''),
  });

  get projectOptionNames(): string[] {
    return this.projectOptions.map(o => o.name);
  }

  get statusOptionNames(): string[] {
    return this.statusOptions.map(o => o.name);
  }

  get statusFilterOptions(): string[] {
    return ['ทั้งหมด', ...this.statusOptionNames];
  }

  getStatusColor(status: string): string {
    const color = this.statusOptions.find(
      o => (o.name ?? '').trim().toLowerCase() === (status ?? '').trim().toLowerCase(),
    )?.color;
    return color || '#ef4444';
  }

  getStatusShadowColor(status: string): string {
    const color = this.getStatusColor(status);
    return `${color}55`;
  }

  trackFocusTaskItem(index: number, item: any): string | number {
    return item?.id ?? index;
  }

  onStatusFilterChange(value: string | number): void {
    this.selectedStatus = String(value || 'ทั้งหมด');
    void this.loadFocusTasks();
  }

  ngOnInit(): void {
    Promise.all([this.loadSettings(), this.loadFocusTasks()]);
  }

  openAddNew(): void {
    this.isEditMode = false;
    this.editingItemId = '';
    this.resetForm();
    this.isAddNew = true;
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.editingItemId = String(item?.id ?? '');
    this.formAddNew.patchValue({
      date: this.getDate(item?.startDate ?? item?.date),
      time: item?.duration ?? 0,
      description: item?.description ?? '',
      projectName: item?.projectName ?? '',
      taskName: item?.taskName ?? '',
      status: item?.status ?? '',
    });
    this.isAddNew = true;
  }

  onCardClick(item: any): void {
    if (this.suppressOpenFromDrag) {
      return;
    }
    this.openEdit(item);
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.focusTaskItems, event.previousIndex, event.currentIndex);
    this.suppressOpenFromDrag = true;
    setTimeout(() => {
      this.suppressOpenFromDrag = false;
    }, 0);
  }

  closeAddNew(): void {
    this.isAddNew = false;
    this.isEditMode = false;
    this.editingItemId = '';
    this.resetForm();
  }

  async onSave(): Promise<void> {
    if (!this.formAddNew.valid || (this.isEditMode && !this.editingItemId)) {
      return;
    }

    const value: any = this.formAddNew.getRawValue();
    const model: any = {
      duration: value.time,
      projectName: value.projectName,
      taskName: value.taskName,
      description: value.description,
      status: value.status,
      startDate: new Date(value.date),
      nameType: 'important',
    };
    if (this.isEditMode) {
      model.id = this.editingItemId;
    }

    try {
      this.saveInProcess = true;
      const result = await firstValueFrom(
        this.isEditMode ? this.historyService.updateTask(model) : this.historyService.addNewTask(model),
      );
      if (result) {
        this.toast.success(this.isEditMode ? 'แก้ไข Focus Task สำเร็จ' : 'เพิ่ม Focus Task สำเร็จ');
        this.closeAddNew();
        this.historyService.notifyDataChanged();
        await this.loadFocusTasks();
      }
    } catch (ex: any) {
      this.toast.error(this.isEditMode ? 'ไม่สามารถแก้ไข Focus Task ได้' : 'ไม่สามารถเพิ่ม Focus Task ได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    } finally {
      this.saveInProcess = false;
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const res = await firstValueFrom(this.settingsService.getSettings());
      const parents = res.parents ?? [];
      const children = res.children ?? [];
      const projectParent = parents.find(p => p.key === 'project');
      const statusParent = parents.find(p => p.key === 'status');
      this.projectOptions = projectParent ? children.filter(c => c.parentId === projectParent.id) : [];
      this.statusOptions = statusParent ? children.filter(c => c.parentId === statusParent.id) : [];
    } catch {
      this.projectOptions = [];
      this.statusOptions = [];
    }
  }

  private async loadFocusTasks(): Promise<void> {
    this.isLoading = true;
    try {
      const req: HistoryQueryRequest = {
        page: 1,
        pageSize: 9999,
        isAllFilter: true,
        nameType: 'important',
        status: this.selectedStatus !== 'ทั้งหมด' ? this.selectedStatus : undefined,
      };
      const res = await firstValueFrom(this.historyService.getTask(req));
      const items = Array.isArray(res) ? res : ((res as any).items ?? []);
      this.focusTaskItems = items;
        // .filter((item: any) => this.isImportantType(item))
        // .sort((a: any, b: any) => +new Date(b.startDate ?? b.date ?? 0) - +new Date(a.startDate ?? a.date ?? 0));
    } catch {
      this.focusTaskItems = [];
    } finally {
      this.isLoading = false;
    }
  }

  private isFocusTaskType(item: any): boolean {
    return String(item?.nameType ?? '').trim().toLowerCase() === 'important';
  }

  private resetForm(): void {
    this.formAddNew.patchValue({
      date: this.getToday(),
      time: 0,
      description: '',
      projectName: '',
      taskName: '',
      status: '',
    });
  }

  private getDate(date: any): string {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
      return this.getToday();
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

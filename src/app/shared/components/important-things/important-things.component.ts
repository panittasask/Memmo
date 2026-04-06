import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DatepickerComponent } from '../datepicker/datepicker.component';
import { DropdownListComponent } from '../dropdown-list/dropdown-list.component';
import { DropdownChildItem, SettingsService } from '../../services/settings.service';
import { HistoryService, HistoryQueryRequest } from '../../services/history.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-important-things',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatepickerComponent, DropdownListComponent],
  templateUrl: './important-things.component.html',
  styleUrl: './important-things.component.scss',
})
export class ImportantThingsComponent {
  private readonly historyService = inject(HistoryService);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);

  isLoading = false;
  isAddNew = false;
  saveInProcess = false;

  importantItems: any[] = [];
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

  ngOnInit(): void {
    Promise.all([this.loadSettings(), this.loadImportantThings()]);
  }

  openAddNew(): void {
    this.isAddNew = true;
  }

  closeAddNew(): void {
    this.isAddNew = false;
  }

  async onSave(): Promise<void> {
    if (!this.formAddNew.valid) {
      return;
    }

    const value: any = this.formAddNew.getRawValue();
    const model = {
      duration: value.time,
      projectName: value.projectName,
      taskName: value.taskName,
      description: value.description,
      status: value.status,
      startDate: new Date(value.date),
      nameType: 'important',
    };

    try {
      this.saveInProcess = true;
      const result = await firstValueFrom(this.historyService.addNewTask(model));
      if (result) {
        this.toast.success('เพิ่ม Important Thing สำเร็จ');
        this.closeAddNew();
        this.formAddNew.patchValue({
          date: this.getToday(),
          time: 0,
          description: '',
          projectName: '',
          taskName: '',
          status: '',
        });
        this.historyService.notifyDataChanged();
        await this.loadImportantThings();
      }
    } catch (ex: any) {
      this.toast.error('ไม่สามารถเพิ่ม Important Thing ได้', {
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

  private async loadImportantThings(): Promise<void> {
    this.isLoading = true;
    try {
      const req: HistoryQueryRequest = {
        page: 1,
        pageSize: 9999,
        isAllFilter: true,
        nameType:'important'
      };
      const res = await firstValueFrom(this.historyService.getTask(req));
      const items = Array.isArray(res) ? res : ((res as any).items ?? []);
      this.importantItems = items;
        // .filter((item: any) => this.isImportantType(item))
        // .sort((a: any, b: any) => +new Date(b.startDate ?? b.date ?? 0) - +new Date(a.startDate ?? a.date ?? 0));
    } catch {
      this.importantItems = [];
    } finally {
      this.isLoading = false;
    }
  }

  private isImportantType(item: any): boolean {
    return String(item?.nameType ?? '').trim().toLowerCase() === 'important';
  }

  private getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

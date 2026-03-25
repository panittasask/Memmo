import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import {
  GridItemComponent,
  GridPageChangeEvent,
} from '../../shared/components/grid-item/grid-item.component';
import {
  DropdownParentItem,
  DropdownChildItem,
  SettingsService,
} from '../../shared/services/settings.service';
import { firstValueFrom } from 'rxjs';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ColumnSettings } from '../../shared/models/column-settings.model';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, GridItemComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  parents: DropdownParentItem[] = [];
  allChildren: DropdownChildItem[] = [];

  activeParentId = '';

  get activeParent(): DropdownParentItem | undefined {
    return this.parents.find(p => p.id === this.activeParentId);
  }

  columns: ColumnSettings[] = [
    { field: 'key', type: 'text', text: 'Key', width: 150 },
    { field: 'name', type: 'text', text: 'ชื่อ', width: 250 },
    { type: 'action', text: 'จัดการ', width: 80 },
  ];

  data: DropdownChildItem[] = [];

  isShowForm = false;
  editingChild: DropdownChildItem | null = null;

  formChild = new FormGroup({
    id: new FormControl(''),
    key: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
  });

  isShowParentForm = false;
  editingParent: DropdownParentItem | null = null;

  formParent = new FormGroup({
    id: new FormControl(''),
    key: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
  });

  constructor() {
    effect(() => {
      if (this.settingsService.refreshTrigger() > 0) {
        this.loadSettings();
      }
    });
  }

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      const response = await firstValueFrom(this.settingsService.getSettings());
      this.parents = response.parents ?? [];
      this.allChildren = response.children ?? [];

      if (this.parents.length > 0) {
        const stillExists = this.parents.some(p => p.id === this.activeParentId);
        if (!this.activeParentId || !stillExists) {
          this.activeParentId = this.parents[0].id;
        }
      } else {
        this.activeParentId = '';
      }

      this.filterChildren();
    } catch (ex: any) {
      this.toast.error('ไม่สามารถโหลดข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  switchTab(parentId: string) {
    this.activeParentId = parentId;
    this.isShowForm = false;
    this.filterChildren();
  }

  private filterChildren() {
    this.data = this.allChildren.filter(c => c.parentId === this.activeParentId);
  }

  openAddForm() {
    this.editingChild = null;
    this.formChild.reset({ id: '', key: '', name: '' });
    this.isShowForm = true;
  }

  selectedItem(item: DropdownChildItem) {
    this.editingChild = item;
    this.formChild.patchValue({
      id: item.id,
      key: item.key,
      name: item.name,
    });
    this.isShowForm = true;
  }

  async onSave() {
    if (!this.formChild.valid || !this.activeParentId) return;

    const raw = this.formChild.getRawValue();

    try {
      const result = await firstValueFrom(
        this.settingsService.updateChild({
          id: raw.id ?? '',
          parentId: this.activeParentId,
          key: raw.key!,
          name: raw.name!,
        }),
      );
      if (result) {
        this.toast.success('บันทึกข้อมูลสำเร็จ');
        this.isShowForm = false;
        await this.loadSettings();
      }
    } catch (ex: any) {
      this.toast.error('ไม่สามารถบันทึกข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  openAddParentForm() {
    this.editingParent = null;
    this.formParent.reset({ id: '', key: '', name: '' });
    this.isShowParentForm = true;
  }

  async onSaveParent() {
    if (!this.formParent.valid) return;

    const raw = this.formParent.getRawValue();

    try {
      const result = await firstValueFrom(
        this.settingsService.updateParent({
          id: raw.id ?? '',
          key: raw.key!,
          name: raw.name!,
        }),
      );
      if (result) {
        this.toast.success('บันทึกข้อมูลสำเร็จ');
        this.isShowParentForm = false;
        await this.loadSettings();
      }
    } catch (ex: any) {
      this.toast.error('ไม่สามารถบันทึกข้อมูลได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  async deleteParent(parent: DropdownParentItem) {
    const confirmed = await this.confirmService.confirm({
      title: 'ลบหมวดหมู่',
      message: `ต้องการลบหมวดหมู่ "${parent.name}" หรือไม่?`,
      confirmText: 'ลบ',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.settingsService.deleteParent(parent.id));
      this.toast.success('ลบหมวดหมู่สำเร็จ');
      if (this.activeParentId === parent.id) {
        this.activeParentId = '';
      }
      await this.loadSettings();
    } catch (ex: any) {
      this.toast.error('ไม่สามารถลบหมวดหมู่ได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  async deleteChild(item: DropdownChildItem) {
    const confirmed = await this.confirmService.confirm({
      title: 'ลบรายการ',
      message: `ต้องการลบรายการ "${item.name}" หรือไม่?`,
      confirmText: 'ลบ',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.settingsService.deleteChild(item.id));
      this.toast.success('ลบรายการสำเร็จ');
      await this.loadSettings();
    } catch (ex: any) {
      this.toast.error('ไม่สามารถลบรายการได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }
}

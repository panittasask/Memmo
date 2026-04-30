import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { WorkNote, WorkNoteService } from '../../services/work-note.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-work-note',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './work-note.component.html',
  styleUrl: './work-note.component.scss',
})
export class WorkNoteComponent {
  private readonly workNoteService = inject(WorkNoteService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  isLoading = false;
  isFormOpen = false;
  isEditMode = false;
  saveInProcess = false;
  editingId = '';

  notes: WorkNote[] = [];

  form = new FormGroup({
    title: new FormControl('', [Validators.required]),
    detail: new FormControl(''),
  });

  ngOnInit(): void {
    void this.loadNotes();
  }

  trackNote(index: number, item: WorkNote): string | number {
    return item?.id ?? index;
  }

  async loadNotes(): Promise<void> {
    this.isLoading = true;
    try {
      this.notes = await firstValueFrom(this.workNoteService.getAll());
    } catch {
      this.notes = [];
    } finally {
      this.isLoading = false;
    }
  }

  openAdd(): void {
    this.isEditMode = false;
    this.editingId = '';
    this.resetForm();
    this.isFormOpen = true;
  }

  openEdit(note: WorkNote): void {
    if (!note?.id) return;
    this.isEditMode = true;
    this.editingId = note.id;
    this.form.patchValue({
      title: note.title ?? '',
      detail: note.detail ?? '',
    });
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.isEditMode = false;
    this.editingId = '';
    this.resetForm();
  }

  async onSave(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const model: WorkNote = {
      title: value.title ?? '',
      detail: value.detail ?? null,
    };

    try {
      this.saveInProcess = true;
      if (this.isEditMode && this.editingId) {
        await firstValueFrom(
          this.workNoteService.update(this.editingId, model),
        );
        this.toast.success('แก้ไข Work Note สำเร็จ');
      } else {
        await firstValueFrom(this.workNoteService.create(model));
        this.toast.success('เพิ่ม Work Note สำเร็จ');
      }
      this.closeForm();
      await this.loadNotes();
    } catch (ex: any) {
      this.toast.error(
        this.isEditMode ? 'ไม่สามารถแก้ไขได้' : 'ไม่สามารถเพิ่มได้',
        { detail: ex?.error ?? ex?.message ?? String(ex) },
      );
    } finally {
      this.saveInProcess = false;
    }
  }

  async onDelete(event: MouseEvent, note: WorkNote): Promise<void> {
    event.stopPropagation();
    if (!note?.id) return;
    const confirmed = await this.confirmService.confirm({
      title: 'ลบ Work Note',
      message: `ต้องการลบ "${note.title}" ใช่หรือไม่?`,
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
    });
    if (!confirmed) return;
    try {
      await firstValueFrom(this.workNoteService.delete(note.id));
      this.toast.success('ลบสำเร็จ');
      await this.loadNotes();
    } catch (ex: any) {
      this.toast.error('ไม่สามารถลบได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  private resetForm(): void {
    this.form.reset({
      title: '',
      detail: '',
    });
  }
}

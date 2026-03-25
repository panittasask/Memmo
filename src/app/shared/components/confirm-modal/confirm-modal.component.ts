import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';

export interface ConfirmModalData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onCancel()" [@fadeIn]>
      <div class="modal-container" (click)="$event.stopPropagation()" [@scaleIn]>
        <div class="modal-header">
          <div class="modal-icon-wrapper">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="modal-title">{{ data.title || 'ยืนยันการดำเนินการ' }}</h3>
          <button type="button" class="modal-close" (click)="onCancel()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="message-text">{{ data.message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="onCancel()">
            {{ data.cancelText || 'ยกเลิก' }}
          </button>
          <button type="button" class="btn-confirm" (click)="onConfirm()">
            {{ data.confirmText || 'ยืนยัน' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .modal-container {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      background: #fef3c7;
      color: #d97706;
    }

    .modal-title {
      flex: 1;
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #1e293b;
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      border-radius: 8px;
      cursor: pointer;
      color: #94a3b8;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .modal-close:hover {
      background: #f1f5f9;
      color: #475569;
    }

    .modal-body {
      padding: 20px 24px;
    }

    .message-text {
      margin: 0;
      font-size: 15px;
      color: #475569;
      line-height: 1.6;
    }

    .modal-footer {
      padding: 16px 24px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-cancel {
      padding: 9px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .btn-cancel:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-confirm {
      padding: 9px 20px;
      border: none;
      border-radius: 10px;
      background: #ef4444;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-confirm:hover {
      background: #dc2626;
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class ConfirmModalComponent {
  data!: ConfirmModalData;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ToastType } from '../toast/toast.component';

export interface ToastDetailData {
  type: ToastType;
  message: string;
  detail?: string;
}

@Component({
  selector: 'app-toast-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="close()" [@fadeIn]>
      <div class="modal-container" [class.error]="data.type === 'error'" [class.warning]="data.type === 'warning'" (click)="$event.stopPropagation()" [@scaleIn]>
        <div class="modal-header">
          <div class="modal-icon-wrapper" [class.error]="data.type === 'error'" [class.warning]="data.type === 'warning'">
            <i [ngClass]="iconClass"></i>
          </div>
          <h3 class="modal-title">{{ data.type === 'error' ? 'Error Detail' : 'Warning Detail' }}</h3>
          <button type="button" class="modal-close" (click)="close()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="message-section">
            <label>ข้อความ</label>
            <p class="message-text">{{ data.message }}</p>
          </div>
          <div class="detail-section" *ngIf="data.detail">
            <label>รายละเอียด</label>
            <pre class="detail-text">{{ data.detail }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-close-modal" (click)="close()">ปิด</button>
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .modal-container {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      max-height: 80vh;
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
    }

    .modal-icon-wrapper.error {
      background: #fef2f2;
      color: #dc2626;
    }

    .modal-icon-wrapper.warning {
      background: #fffbeb;
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
      overflow-y: auto;
      flex: 1;
    }

    .message-section, .detail-section {
      margin-bottom: 16px;
    }

    .message-section:last-child, .detail-section:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .message-text {
      margin: 0;
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
    }

    .detail-text {
      margin: 0;
      font-size: 13px;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      max-height: 240px;
      overflow-y: auto;
      font-family: 'Noto Sans Thai', 'Noto Sans', monospace;
    }

    .modal-footer {
      padding: 16px 24px 20px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #f1f5f9;
    }

    .btn-close-modal {
      padding: 8px 24px;
      border: none;
      border-radius: 8px;
      background: #f1f5f9;
      color: #334155;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-close-modal:hover {
      background: #e2e8f0;
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
      ]),
    ]),
  ],
})
export class ToastDetailModalComponent {
  data!: ToastDetailData;

  @Output() closed = new EventEmitter<void>();

  get iconClass(): string {
    return this.data.type === 'error'
      ? 'fa-solid fa-circle-xmark'
      : 'fa-solid fa-triangle-exclamation';
  }

  close(): void {
    this.closed.emit();
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  animate,
  state,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastData {
  message: string;
  type: ToastType;
  duration: number;
  detail?: string;
  showDetailOnClick?: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="toast"
      [class.success]="data.type === 'success'"
      [class.warning]="data.type === 'warning'"
      [class.error]="data.type === 'error'"
      [class.clickable]="isClickable"
      [@slideIn]="animationState"
      (@slideIn.done)="onAnimationDone($event)"
      (click)="onBodyClick($event)"
    >
      <i class="toast-icon" [ngClass]="iconClass"></i>
      <span class="toast-message">{{ data.message }}</span>
      <svg class="countdown-spinner" viewBox="0 0 24 24" *ngIf="data.type === 'success'">
        <circle
          class="countdown-track"
          cx="12" cy="12" r="10"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          stroke-width="2.5"
        />
        <circle
          class="countdown-circle"
          cx="12" cy="12" r="10"
          fill="none"
          stroke="#fff"
          stroke-width="2.5"
          stroke-linecap="round"
          [style.animation-duration]="data.duration + 'ms'"
        />
      </svg>
      <button class="toast-close" (click)="close($event)">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 280px;
      max-width: 420px;
      padding: 22px 26px;
      border-radius: 8px;
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
    }
    .toast.clickable {
      cursor: pointer;
    }
    .success {
      background-color: #16a34a;
    }
    .warning {
      background-color: #d97706;
    }
    .error {
      background-color: #dc2626;
    }
    .toast-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    .toast-message {
      flex: 1;
      word-break: break-word;
    }
    .countdown-spinner {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      transform: rotate(-90deg);
    }
    .countdown-circle {
      stroke-dasharray: 62.83;
      stroke-dashoffset: 0;
      animation: countdown-spin linear forwards;
    }
    @keyframes countdown-spin {
      from { stroke-dashoffset: 0; }
      to   { stroke-dashoffset: 62.83; }
    }
    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 14px;
      opacity: 0.8;
      padding: 2px 4px;
      display: flex;
      align-items: center;
      transition: opacity 0.2s;
    }
    .toast-close:hover {
      opacity: 1;
    }
  `],
  animations: [
    trigger('slideIn', [
      state('visible', style({ transform: 'translateX(0)', opacity: 1 })),
      state('closing', style({ transform: 'translateX(100%)', opacity: 0 })),
      transition('void => visible', animate('250ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('visible => closing', animate('250ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ]),
  ],
})
export class ToastComponent {
  data!: ToastData;
  animationState = 'visible';

  @Output() closed = new EventEmitter<void>();
  @Output() showDetail = new EventEmitter<void>();

  get iconClass(): string {
    switch (this.data.type) {
      case 'success':
        return 'fa-solid fa-circle-check';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'error':
        return 'fa-solid fa-circle-xmark';
    }
  }

  get isClickable(): boolean {
    return this.data.type === 'success' || !!this.data.showDetailOnClick;
  }

  onBodyClick(event: MouseEvent): void {
    // Don't handle if the close button was clicked
    const target = event.target as HTMLElement;
    if (target.closest('.toast-close')) return;

    if (this.data.type === 'success') {
      this.startClose();
      return;
    }

    // error/warning: show detail modal if enabled
    if (this.data.showDetailOnClick) {
      this.showDetail.emit();
    }
  }

  startClose(): void {
    this.animationState = 'closing';
  }

  onAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'closing') {
      this.closed.emit();
    }
  }

  close(event: MouseEvent): void {
    event.stopPropagation();
    this.startClose();
  }
}

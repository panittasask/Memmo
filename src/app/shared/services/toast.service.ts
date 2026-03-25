import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef } from '@angular/core';
import { ToastComponent, ToastData, ToastType } from '../components/toast/toast.component';
import { ToastDetailModalComponent } from '../components/toast-detail-modal/toast-detail-modal.component';

export interface ToastOptions {
  duration?: number;
  detail?: string;
  showDetailOnClick?: boolean;
}

interface ActiveToast {
  overlayRef: OverlayRef;
  componentRef: ComponentRef<ToastComponent>;
  timeout: ReturnType<typeof setTimeout> | null;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly overlay = inject(Overlay);
  private activeToasts: ActiveToast[] = [];
  private modalRef: OverlayRef | null = null;

  success(message: string, options?: ToastOptions): void {
    this.show({
      message,
      type: 'success',
      duration: options?.duration ?? 3000,
      detail: options?.detail,
      showDetailOnClick: false,
    });
  }

  warning(message: string, options?: ToastOptions): void {
    this.show({
      message,
      type: 'warning',
      duration: 0,
      detail: options?.detail,
      showDetailOnClick: options?.showDetailOnClick ?? true,
    });
  }

  error(message: string, options?: ToastOptions): void {
    this.show({
      message,
      type: 'error',
      duration: 0,
      detail: options?.detail,
      showDetailOnClick: options?.showDetailOnClick ?? true,
    });
  }

  private show(data: ToastData): void {
    const topOffset = this.getTopOffset();
    const positionStrategy = this.overlay
      .position()
      .global()
      .top(topOffset)
      .right('20px');

    const overlayRef = this.overlay.create({ positionStrategy });
    const portal = new ComponentPortal(ToastComponent);
    const componentRef = overlayRef.attach<ToastComponent>(portal);

    componentRef.instance.data = data;
    componentRef.instance.closed.subscribe(() => this.dispose(overlayRef));
    componentRef.instance.showDetail.subscribe(() => {
      this.openDetailModal(data);
      this.startClose(overlayRef);
    });

    // Only auto-dismiss for success toasts
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (data.type === 'success' && data.duration > 0) {
      timeout = setTimeout(() => this.startClose(overlayRef), data.duration);
    }

    this.activeToasts.push({ overlayRef, componentRef, timeout });
  }

  private startClose(overlayRef: OverlayRef): void {
    const toast = this.activeToasts.find((t) => t.overlayRef === overlayRef);
    if (!toast) return;
    toast.componentRef.instance.startClose();
  }

  private dispose(overlayRef: OverlayRef): void {
    const index = this.activeToasts.findIndex((t) => t.overlayRef === overlayRef);
    if (index === -1) return;

    const toast = this.activeToasts[index];
    if (toast.timeout) clearTimeout(toast.timeout);
    this.activeToasts.splice(index, 1);
    overlayRef.dispose();
    this.repositionAll();
  }

  private openDetailModal(data: ToastData): void {
    if (this.modalRef) {
      this.modalRef.dispose();
      this.modalRef = null;
    }

    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();

    this.modalRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new ComponentPortal(ToastDetailModalComponent);
    const ref = this.modalRef.attach<ToastDetailModalComponent>(portal);

    ref.instance.data = {
      type: data.type,
      message: data.message,
      detail: data.detail,
    };

    ref.instance.closed.subscribe(() => {
      this.modalRef?.dispose();
      this.modalRef = null;
    });
  }

  private getTopOffset(): string {
    const base = 20;
    const gap = 80;
    return `${base + this.activeToasts.length * gap}px`;
  }

  private repositionAll(): void {
    const base = 20;
    const gap = 80;
    this.activeToasts.forEach((toast, i) => {
      toast.overlayRef.updatePositionStrategy(
        this.overlay.position().global().top(`${base + i * gap}px`).right('20px'),
      );
    });
  }
}

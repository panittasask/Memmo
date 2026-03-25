import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ConfirmModalComponent, ConfirmModalData } from '../components/confirm-modal/confirm-modal.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  confirm(data: ConfirmModalData): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
      }

      const positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically();

      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: false,
        scrollStrategy: this.overlay.scrollStrategies.block(),
      });

      const portal = new ComponentPortal(ConfirmModalComponent);
      const ref = this.overlayRef.attach<ConfirmModalComponent>(portal);

      ref.instance.data = data;

      ref.instance.confirmed.subscribe(() => {
        this.dispose();
        resolve(true);
      });

      ref.instance.cancelled.subscribe(() => {
        this.dispose();
        resolve(false);
      });
    });
  }

  private dispose(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}

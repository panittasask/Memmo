import { CommonModule } from '@angular/common';
import {
  ConnectedPosition,
  Overlay,
  OverlayModule,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-dropdown-list',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './dropdown-list.component.html',
  styleUrl: './dropdown-list.component.scss',
})
export class DropdownListComponent implements AfterViewInit, OnDestroy {
  private resizeObserver?: ResizeObserver;
  private readonly overlay = inject(Overlay);
  private readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  ];

  @Input() label = '';
  @Input() value: string | number | null = null;
  @Input() options: (string | number)[] = [];
  @Input() placeholder = 'Select';
  @Output() valueChange = new EventEmitter<string | number>();
  @ViewChild('triggerButton') triggerButton?: ElementRef<HTMLButtonElement>;

  isOpen = false;
  triggerWidth = 88;
  readonly overlayScrollStrategy: ScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly overlayPositions: ConnectedPosition[] = this.positions;

  ngAfterViewInit(): void {
    this.syncTriggerWidth();

    if (typeof ResizeObserver !== 'undefined' && this.triggerButton?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.syncTriggerWidth());
      this.resizeObserver.observe(this.triggerButton.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  get displayValue(): string {
    if (this.value === null || this.value === undefined) {
      return this.placeholder;
    }

    return String(this.value);
  }

  trackByValue(_: number, option: string | number): string | number {
    return option;
  }

  selectOption(option: string | number): void {
    if (option !== this.value) {
      this.valueChange.emit(option);
    }

    this.closePopover();
  }

  toggleDropdown(): void {
    this.syncTriggerWidth();
    this.isOpen = !this.isOpen;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncTriggerWidth();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.closePopover();
    }
  }

  closePopover(): void {
    this.isOpen = false;
  }

  onOverlayDetach(): void {
    this.isOpen = false;
  }

  private syncTriggerWidth(): void {
    const triggerElement = this.triggerButton?.nativeElement;
    this.triggerWidth = Math.max(triggerElement?.offsetWidth ?? 0, 88);
  }
}

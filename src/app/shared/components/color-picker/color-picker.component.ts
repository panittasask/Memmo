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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ConnectedPosition,
  Overlay,
  OverlayModule,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import { inject } from '@angular/core';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#64748b',
  '#0f172a', '#ffffff',
];

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
})
export class ColorPickerComponent implements AfterViewInit, OnDestroy {
  private readonly overlay = inject(Overlay);
  private resizeObserver?: ResizeObserver;

  private readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  ];

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  isOpen = false;
  triggerWidth = 88;
  readonly presets = PRESET_COLORS;
  readonly overlayScrollStrategy: ScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly overlayPositions: ConnectedPosition[] = this.positions;

  ngAfterViewInit(): void {
    this.syncWidth();
    if (typeof ResizeObserver !== 'undefined' && this.triggerBtn?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.syncWidth());
      this.resizeObserver.observe(this.triggerBtn.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  get displayColor(): string {
    return this.value || '#e2e8f0';
  }

  toggle(): void {
    this.syncWidth();
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  selectPreset(color: string): void {
    this.valueChange.emit(color);
    this.close();
  }

  onNativeInput(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.valueChange.emit(color);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncWidth();
  }

  private syncWidth(): void {
    if (this.triggerBtn?.nativeElement) {
      this.triggerWidth = this.triggerBtn.nativeElement.offsetWidth;
    }
  }
}

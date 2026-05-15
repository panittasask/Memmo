import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="timepicker-wrapper" #wrapper>
      <div class="timepicker-input" [class.is-open]="isOpen" (click)="toggle()">
        <i class="fa-regular fa-clock"></i>
        <span [class.placeholder]="!value">{{
          displayValue || placeholder
        }}</span>
        <i
          class="fa-solid fa-xmark clear-icon"
          *ngIf="value"
          (click)="clear($event)"
        ></i>
      </div>

      <div
        class="timepicker-dropdown"
        *ngIf="isOpen"
        [@dropdownAnim]="'visible'"
        [style.top.px]="dropdownTop"
        [style.left.px]="dropdownLeft"
        (click)="$event.stopPropagation()"
      >
        <div class="dropdown-header">
          <div class="time-display">
            <span class="time-segment">{{ pad(selectedHour) }}</span>
            <span class="time-colon">:</span>
            <span class="time-segment">{{ pad(selectedMinute) }}</span>
          </div>
          <span class="period-tag">24 ชม.</span>
        </div>

        <div class="dropdown-body">
          <div class="column">
            <div class="column-label">ชั่วโมง</div>
            <div class="column-list" #hoursList>
              <button
                *ngFor="let h of hours"
                type="button"
                class="column-cell"
                [class.selected]="h === selectedHour"
                (click)="selectHour(h)"
              >
                {{ pad(h) }}
              </button>
            </div>
          </div>
          <div class="column">
            <div class="column-label">นาที</div>
            <div class="column-list" #minutesList>
              <button
                *ngFor="let m of minutes"
                type="button"
                class="column-cell"
                [class.selected]="m === selectedMinute"
                (click)="selectMinute(m)"
              >
                {{ pad(m) }}
              </button>
            </div>
          </div>
        </div>

        <div class="dropdown-footer">
          <button type="button" class="btn-now" (click)="setNow()">
            <i class="fa-regular fa-clock"></i> ตอนนี้
          </button>
          <button type="button" class="btn-confirm" (click)="confirm()">
            ตกลง
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .timepicker-wrapper {
        position: relative;
      }

      .timepicker-input {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
        color: #1e293b;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
        min-height: 38px;
        user-select: none;
      }

      .timepicker-input:hover {
        border-color: #94a3b8;
      }

      .timepicker-input.is-open,
      .timepicker-input:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      }

      .timepicker-input .fa-clock {
        color: #64748b;
        font-size: 14px;
      }

      .timepicker-input span {
        flex: 1;
      }

      .timepicker-input .placeholder {
        color: #94a3b8;
      }

      .clear-icon {
        color: #94a3b8;
        font-size: 12px;
        padding: 2px;
        border-radius: 50%;
        transition:
          color 0.2s,
          background 0.2s;
      }

      .clear-icon:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      .timepicker-dropdown {
        position: fixed;
        z-index: 99999;
        background: #fff;
        border-radius: 14px;
        box-shadow:
          0 10px 32px rgba(0, 0, 0, 0.14),
          0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid #e2e8f0;
        width: 260px;
        overflow: hidden;
        user-select: none;
      }

      .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        color: #fff;
      }

      .time-display {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 1px;
        font-variant-numeric: tabular-nums;
      }

      .time-colon {
        animation: blink 1.2s ease-in-out infinite;
      }

      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }

      .period-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        letter-spacing: 0.5px;
      }

      .dropdown-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 10px 12px;
      }

      .column {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .column-label {
        text-align: center;
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 4px 0 6px;
      }

      .column-list {
        max-height: 180px;
        overflow-y: auto;
        scroll-behavior: smooth;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 2px;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }

      .column-list::-webkit-scrollbar {
        width: 6px;
      }
      .column-list::-webkit-scrollbar-track {
        background: transparent;
      }
      .column-list::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .column-list::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .column-cell {
        border: none;
        background: none;
        padding: 8px 4px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #334155;
        cursor: pointer;
        text-align: center;
        font-variant-numeric: tabular-nums;
        transition:
          background 0.15s,
          color 0.15s,
          transform 0.1s;
      }

      .column-cell:hover {
        background: #eff6ff;
        color: #2563eb;
      }

      .column-cell.selected {
        background: #3b82f6;
        color: #fff;
        font-weight: 700;
        transform: scale(1.02);
      }

      .column-cell.selected:hover {
        background: #2563eb;
      }

      .dropdown-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px 12px;
        border-top: 1px solid #f1f5f9;
      }

      .btn-now {
        border: none;
        background: none;
        color: #3b82f6;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s;
      }

      .btn-now:hover {
        background: #eff6ff;
      }

      .btn-confirm {
        border: none;
        background: #3b82f6;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 7px 18px;
        border-radius: 8px;
        transition:
          background 0.15s,
          transform 0.1s;
      }

      .btn-confirm:hover {
        background: #2563eb;
      }

      .btn-confirm:active {
        transform: scale(0.97);
      }
    `,
  ],
  animations: [
    trigger('dropdownAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px) scale(0.96)' }),
        animate(
          '180ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '120ms ease-in',
          style({ opacity: 0, transform: 'translateY(-6px) scale(0.97)' }),
        ),
      ]),
    ]),
  ],
})
export class TimePickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'เลือกเวลา';
  @Input() minuteStep = 1;

  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLElement>;
  @ViewChild('hoursList') hoursListRef?: ElementRef<HTMLElement>;
  @ViewChild('minutesList') minutesListRef?: ElementRef<HTMLElement>;

  value = '';
  isOpen = false;
  dropdownTop = 0;
  dropdownLeft = 0;

  selectedHour = new Date().getHours();
  selectedMinute = this.roundToStep(new Date().getMinutes());

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  get hours(): number[] {
    return Array.from({ length: 24 }, (_, i) => i);
  }

  get minutes(): number[] {
    const step = Math.max(1, Math.min(30, this.minuteStep || 1));
    const out: number[] = [];
    for (let m = 0; m < 60; m += step) out.push(m);
    return out;
  }

  get displayValue(): string {
    if (!this.value) return '';
    const [h, m] = this.value.split(':').map((n) => Number(n));
    if (Number.isNaN(h) || Number.isNaN(m)) return '';
    return `${this.pad(h)}:${this.pad(m)} น.`;
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  // ControlValueAccessor
  writeValue(val: string): void {
    this.value = val ?? '';
    if (this.value) {
      const [h, m] = this.value.split(':').map((n) => Number(n));
      if (!Number.isNaN(h)) this.selectedHour = h;
      if (!Number.isNaN(m)) this.selectedMinute = m;
    } else {
      const now = new Date();
      this.selectedHour = now.getHours();
      this.selectedMinute = this.roundToStep(now.getMinutes());
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
      const rect = (
        this.wrapperRef.nativeElement as HTMLElement
      ).getBoundingClientRect();
      this.dropdownTop = rect.bottom + 6;
      this.dropdownLeft = rect.left;
      // delay so view renders
      setTimeout(() => this.scrollIntoView(), 0);
    }
  }

  close(): void {
    this.isOpen = false;
  }

  clear(e: MouseEvent): void {
    e.stopPropagation();
    this.value = '';
    const now = new Date();
    this.selectedHour = now.getHours();
    this.selectedMinute = this.roundToStep(now.getMinutes());
    this.onChange('');
    this.close();
  }

  selectHour(h: number): void {
    this.selectedHour = h;
  }

  selectMinute(m: number): void {
    this.selectedMinute = m;
  }

  setNow(): void {
    const now = new Date();
    this.selectedHour = now.getHours();
    this.selectedMinute = this.roundToStep(now.getMinutes());
    this.scrollIntoView();
  }

  private roundToStep(minutes: number): number {
    const step = Math.max(1, this.minuteStep || 1);
    let rounded = Math.round(minutes / step) * step;
    if (rounded >= 60) rounded = 60 - step;
    return rounded;
  }

  confirm(): void {
    this.value = `${this.pad(this.selectedHour)}:${this.pad(this.selectedMinute)}`;
    this.onChange(this.value);
    this.close();
  }

  private scrollIntoView(): void {
    const scrollSelected = (container?: HTMLElement) => {
      if (!container) return;
      const selected = container.querySelector(
        '.column-cell.selected',
      ) as HTMLElement | null;
      if (selected) {
        const offset =
          selected.offsetTop -
          container.clientHeight / 2 +
          selected.clientHeight / 2;
        container.scrollTop = Math.max(0, offset);
      }
    };
    scrollSelected(this.hoursListRef?.nativeElement);
    scrollSelected(this.minutesListRef?.nativeElement);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (
      this.isOpen &&
      this.wrapperRef &&
      !this.wrapperRef.nativeElement.contains(event.target as Node)
    ) {
      this.close();
    }
  }
}

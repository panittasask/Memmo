import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dateString: string;
}

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="datepicker-wrapper" #wrapper>
      <div class="datepicker-input" (click)="toggle()">
        <i class="fa-regular fa-calendar"></i>
        <span [class.placeholder]="!displayValue">{{ displayValue || placeholder }}</span>
        <i
          class="fa-solid fa-xmark clear-icon"
          *ngIf="value"
          (click)="clear($event)"
        ></i>
      </div>

      <div class="calendar-dropdown" *ngIf="isOpen" [@dropdownAnim]="'visible'"
        [style.top.px]="calendarTop"
        [style.left.px]="calendarLeft"
      >
        <div class="calendar-header">
          <button type="button" class="nav-btn" (click)="prevMonth()">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="month-year" (click)="toggleYearView()">
            {{ monthNames[viewMonth] }} {{ viewYear }}
          </span>
          <button type="button" class="nav-btn" (click)="nextMonth()">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div class="calendar-body" *ngIf="!isYearView">
          <div class="weekdays">
            <span *ngFor="let d of dayLabels">{{ d }}</span>
          </div>
          <div class="days-grid">
            <button
              *ngFor="let day of calendarDays"
              type="button"
              class="day-cell"
              [class.other-month]="!day.isCurrentMonth"
              [class.today]="day.isToday"
              [class.selected]="day.isSelected"
              (click)="selectDay(day)"
            >
              {{ day.date }}
            </button>
          </div>
        </div>

        <div class="year-grid" *ngIf="isYearView">
          <button
            *ngFor="let y of yearRange"
            type="button"
            class="year-cell"
            [class.selected]="y === viewYear"
            [class.current-year]="y === todayYear"
            (click)="selectYear(y)"
          >
            {{ y }}
          </button>
        </div>

        <div class="calendar-footer">
          <button type="button" class="today-btn" (click)="goToday()">วันนี้</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }

    .datepicker-wrapper {
      position: relative;
    }

    .datepicker-input {
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
      transition: border-color 0.2s, box-shadow 0.2s;
      min-height: 38px;
    }

    .datepicker-input:hover {
      border-color: #94a3b8;
    }

    .datepicker-input:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .datepicker-input .fa-calendar {
      color: #64748b;
      font-size: 14px;
    }

    .datepicker-input span {
      flex: 1;
      user-select: none;
    }

    .datepicker-input .placeholder {
      color: #94a3b8;
    }

    .clear-icon {
      color: #94a3b8;
      font-size: 12px;
      padding: 2px;
      border-radius: 50%;
      transition: color 0.2s, background 0.2s;
    }

    .clear-icon:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .calendar-dropdown {
      position: fixed;
      z-index: 99999;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
      width: 300px;
      overflow: hidden;
      user-select: none;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 12px 10px;
    }

    .nav-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      border-radius: 8px;
      cursor: pointer;
      color: #475569;
      font-size: 13px;
      transition: background 0.15s, color 0.15s;
    }

    .nav-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .month-year {
      font-weight: 600;
      font-size: 15px;
      color: #1e293b;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 6px;
      transition: background 0.15s;
    }

    .month-year:hover {
      background: #f1f5f9;
    }

    .calendar-body {
      padding: 0 12px;
    }

    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-bottom: 4px;
    }

    .weekdays span {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      padding: 4px 0;
      text-transform: uppercase;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .day-cell {
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, transform 0.1s;
    }

    .day-cell:hover {
      background: #eff6ff;
      color: #2563eb;
      transform: scale(1.05);
    }

    .day-cell.other-month {
      color: #cbd5e1;
    }

    .day-cell.other-month:hover {
      color: #94a3b8;
      background: #f8fafc;
    }

    .day-cell.today {
      background: #f0f9ff;
      color: #2563eb;
      font-weight: 700;
      position: relative;
    }

    .day-cell.today::after {
      content: '';
      position: absolute;
      bottom: 3px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #3b82f6;
    }

    .day-cell.selected {
      background: #3b82f6;
      color: #fff;
      font-weight: 700;
    }

    .day-cell.selected:hover {
      background: #2563eb;
      color: #fff;
    }

    .day-cell.selected.today::after {
      background: #fff;
    }

    .year-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 8px 12px;
      max-height: 240px;
      overflow-y: auto;
    }

    .year-cell {
      padding: 8px 4px;
      border: none;
      background: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .year-cell:hover {
      background: #eff6ff;
      color: #2563eb;
    }

    .year-cell.selected {
      background: #3b82f6;
      color: #fff;
      font-weight: 700;
    }

    .year-cell.current-year {
      color: #3b82f6;
      font-weight: 700;
    }

    .year-cell.selected.current-year {
      color: #fff;
    }

    .calendar-footer {
      padding: 8px 12px 12px;
      display: flex;
      justify-content: center;
    }

    .today-btn {
      border: none;
      background: none;
      color: #3b82f6;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 16px;
      border-radius: 6px;
      transition: background 0.15s;
    }

    .today-btn:hover {
      background: #eff6ff;
    }
  `],
  animations: [
    trigger('dropdownAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px) scale(0.96)' }),
        animate('180ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0, transform: 'translateY(-6px) scale(0.97)' })),
      ]),
    ]),
  ],
})
export class DatepickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'เลือกวันที่';
  @ViewChild('wrapper') wrapperRef!: ElementRef;

  value = '';
  isOpen = false;
  isYearView = false;
  calendarTop = 0;
  calendarLeft = 0;

  viewMonth = new Date().getMonth();
  viewYear = new Date().getFullYear();

  todayYear = new Date().getFullYear();
  todayMonth = new Date().getMonth();
  todayDate = new Date().getDate();

  calendarDays: CalendarDay[] = [];

  readonly monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  readonly dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  get displayValue(): string {
    if (!this.value) return '';
    const [y, m, d] = this.value.split('-').map(Number);
    return `${d} ${this.monthNames[m - 1]} ${y}`;
  }

  get yearRange(): number[] {
    const start = this.viewYear - 7;
    const years: number[] = [];
    for (let i = 0; i < 20; i++) {
      years.push(start + i);
    }
    return years;
  }

  // ControlValueAccessor
  writeValue(val: string): void {
    this.value = val || '';
    if (this.value) {
      const [y, m] = this.value.split('-').map(Number);
      this.viewYear = y;
      this.viewMonth = m - 1;
    }
    this.buildCalendar();
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Calendar logic
  toggle(): void {
    this.isOpen = !this.isOpen;
    this.isYearView = false;
    if (this.isOpen) {
      this.onTouched();
      this.buildCalendar();
      const rect = (this.wrapperRef.nativeElement as HTMLElement).getBoundingClientRect();
      this.calendarTop = rect.bottom + 6;
      this.calendarLeft = rect.left;
    }
  }

  close(): void {
    this.isOpen = false;
    this.isYearView = false;
  }

  clear(e: MouseEvent): void {
    e.stopPropagation();
    this.value = '';
    this.onChange('');
    this.close();
  }

  prevMonth(): void {
    this.viewMonth--;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    this.viewMonth++;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    }
    this.buildCalendar();
  }

  toggleYearView(): void {
    this.isYearView = !this.isYearView;
  }

  selectYear(year: number): void {
    this.viewYear = year;
    this.isYearView = false;
    this.buildCalendar();
  }

  selectDay(day: CalendarDay): void {
    this.value = day.dateString;
    this.onChange(this.value);
    this.viewYear = day.year;
    this.viewMonth = day.month;
    this.buildCalendar();
    this.close();
  }

  goToday(): void {
    const now = new Date();
    this.value = this.toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.onChange(this.value);
    this.buildCalendar();
    this.close();
  }

  private buildCalendar(): void {
    const firstDay = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(this.viewYear, this.viewMonth, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      let m = this.viewMonth - 1;
      let y = this.viewYear;
      if (m < 0) { m = 11; y--; }
      days.push(this.makeDay(d, m, y, false));
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(this.makeDay(d, this.viewMonth, this.viewYear, true));
    }

    // Next month fill
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      let m = this.viewMonth + 1;
      let y = this.viewYear;
      if (m > 11) { m = 0; y++; }
      days.push(this.makeDay(d, m, y, false));
    }

    this.calendarDays = days;
  }

  private makeDay(date: number, month: number, year: number, isCurrentMonth: boolean): CalendarDay {
    const dateString = this.toDateString(year, month + 1, date);
    return {
      date,
      month,
      year,
      isCurrentMonth,
      isToday: year === this.todayYear && month === this.todayMonth && date === this.todayDate,
      isSelected: dateString === this.value,
      dateString,
    };
  }

  private toDateString(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (this.isOpen && this.wrapperRef && !this.wrapperRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}

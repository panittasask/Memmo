import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface Bar {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  cx: number;
  ly: number;
  vy: number;
  label: string;
  value: number;
  showValue: boolean;
}

interface Tick {
  y: number;
  text: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      @if (data.length === 0) {
        <div class="empty-state">{{ emptyMessage }}</div>
      } @else {
        <svg
          [attr.viewBox]="'0 0 ' + SW + ' ' + SH"
          width="100%"
          class="chart-svg"
        >
          @for (tick of ticks; track tick.y) {
            <line
              [attr.x1]="PL" [attr.y1]="tick.y"
              [attr.x2]="PL + CW" [attr.y2]="tick.y"
              [class]="tick.text === '0' ? 'axis-line' : 'grid-line'"
            />
            <text
              [attr.x]="PL - 6"
              [attr.y]="tick.y + 4"
              class="y-label"
            >{{ tick.text }}</text>
          }

          @for (bar of bars; track $index) {
            <g class="bar-group">
              @if (bar.h > 0) {
                <rect
                  [attr.x]="bar.x"
                  [attr.y]="bar.y"
                  [attr.width]="bar.w"
                  [attr.height]="bar.h"
                  [attr.rx]="bar.rx"
                  class="bar-rect"
                />
                @if (bar.showValue) {
                  <text
                    [attr.x]="bar.cx"
                    [attr.y]="bar.vy"
                    class="bar-value"
                  >{{ bar.value }}</text>
                }
              }
              <text
                [attr.x]="bar.cx"
                [attr.y]="bar.ly"
                class="x-label"
              >{{ bar.label }}</text>
            </g>
          }
        </svg>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .chart-wrap {
      width: 100%;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #94a3b8;
      font-size: 14px;
    }

    .chart-svg {
      display: block;
      overflow: visible;
    }

    .grid-line {
      stroke: #e2e8f0;
      stroke-width: 1;
      stroke-dasharray: 4 4;
    }

    .axis-line {
      stroke: #cbd5e1;
      stroke-width: 1.5;
    }

    .y-label {
      font-size: 11px;
      fill: #94a3b8;
      text-anchor: end;
      font-family: inherit;
    }

    .x-label {
      font-size: 11px;
      fill: #64748b;
      text-anchor: middle;
      font-family: inherit;
    }

    .bar-rect {
      fill: #3b82f6;
      transition: fill 0.15s ease;
      cursor: default;
    }

    .bar-group:hover .bar-rect {
      fill: #2563eb;
    }

    .bar-value {
      font-size: 11px;
      fill: #475569;
      text-anchor: middle;
      font-family: inherit;
    }
  `],
})
export class BarChartComponent implements OnChanges {
  @Input() data: ChartDataPoint[] = [];
  @Input() emptyMessage = 'ไม่มีข้อมูล';

  readonly SW = 600;
  readonly SH = 180;
  readonly PL = 52;
  readonly PR = 20;
  readonly PT = 24;
  readonly PB = 48;
  get CW() { return this.SW - this.PL - this.PR; }
  get CH() { return this.SH - this.PT - this.PB; }

  bars: Bar[] = [];
  ticks: Tick[] = [];

  ngOnChanges(): void {
    this.recompute();
  }

  private recompute(): void {
    const maxVal = Math.max(...this.data.map(d => d.value), 1);
    const step = this.niceStep(maxVal);
    const topVal = Math.ceil(maxVal / step) * step || step;

    this.ticks = [];
    for (let v = 0; v <= topVal; v += step) {
      this.ticks.push({
        y: this.PT + this.CH - (v / topVal) * this.CH,
        text: String(v),
      });
    }

    const n = this.data.length;
    const slotW = this.CW / Math.max(n, 1);
    const bw = Math.max(Math.min(slotW * 0.6, 72), 8);

    this.bars = this.data.map((d, i) => {
      const bh = (d.value / topVal) * this.CH;
      const x = this.PL + i * slotW + (slotW - bw) / 2;
      const y = this.PT + this.CH - bh;
      return {
        x, y, w: bw, h: bh,
        rx: Math.min(6, bh / 2),
        cx: x + bw / 2,
        ly: this.PT + this.CH + 18,
        vy: y - 6,
        label: d.label,
        value: d.value,
        showValue: bh >= 24,
      };
    });
  }

  private niceStep(maxVal: number): number {
    if (maxVal <= 0) return 1;
    const rough = maxVal / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const candidates = [1, 2, 5, 10].map(c => c * mag);
    return candidates.find(c => c >= rough) ?? candidates[candidates.length - 1];
  }
}

import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSlice {
  label: string;
  value: number;
}

interface Arc {
  path: string;
  color: string;
  label: string;
  value: number;
  pct: number;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#6366f1',
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, R: number, ri: number, startDeg: number, endDeg: number): string {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const o1 = polarToXY(cx, cy, R, startDeg);
  const o2 = polarToXY(cx, cy, R, endDeg);
  const i1 = polarToXY(cx, cy, ri, endDeg);
  const i2 = polarToXY(cx, cy, ri, startDeg);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${R} ${R} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${ri} ${ri} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="donut-wrap">
      @if (total === 0) {
        <div class="empty-state">{{ emptyMessage }}</div>
      } @else {
        <div class="chart-row">
          <svg [attr.viewBox]="'0 0 ' + SIZE + ' ' + SIZE" [attr.width]="SIZE" [attr.height]="SIZE" class="donut-svg">
            @for (arc of arcs; track $index) {
              <path [attr.d]="arc.path" [attr.fill]="arc.color" class="arc-slice" />
            }
            <text [attr.x]="CX" [attr.y]="CY - 8" class="center-total">{{ total }}</text>
            <text [attr.x]="CX" [attr.y]="CY + 12" class="center-label">{{ centerLabel }}</text>
          </svg>

          <div class="legend">
            @for (arc of arcs; track $index) {
              <div class="legend-item">
                <span class="legend-dot" [style.background]="arc.color"></span>
                <span class="legend-text">{{ arc.label }}</span>
                <span class="legend-value">{{ arc.value }}</span>
                <span class="legend-pct">({{ arc.pct }}%)</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .donut-wrap { width: 100%; }
    .empty-state {
      display: flex; align-items: center; justify-content: center;
      height: 160px; color: #94a3b8; font-size: 14px;
    }
    .chart-row {
      display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
    }
    .donut-svg { flex-shrink: 0; overflow: visible; }
    .arc-slice {
      transition: opacity 0.15s;
      cursor: default;
      &:hover { opacity: 0.8; }
    }
    .center-total {
      font-size: 22px; font-weight: 700; fill: #0f172a;
      text-anchor: middle; font-family: inherit;
    }
    .center-label {
      font-size: 11px; fill: #94a3b8;
      text-anchor: middle; font-family: inherit;
    }
    .legend {
      flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 120px;
    }
    .legend-item {
      display: flex; align-items: center; gap: 6px; font-size: 13px;
    }
    .legend-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .legend-text { flex: 1; color: #374151; }
    .legend-value { font-weight: 600; color: #0f172a; }
    .legend-pct { color: #94a3b8; font-size: 11px; }
  `],
})
export class DonutChartComponent implements OnChanges {
  @Input() data: DonutSlice[] = [];
  @Input() emptyMessage = 'ไม่มีข้อมูล';
  @Input() centerLabel = 'รวม';

  readonly SIZE = 160;
  readonly CX = 80;
  readonly CY = 80;
  readonly R = 68;
  readonly RI = 44;

  arcs: Arc[] = [];
  total = 0;

  ngOnChanges(): void {
    this.total = this.data.reduce((s, d) => s + d.value, 0);
    if (this.total === 0) { this.arcs = []; return; }

    let startDeg = 0;
    this.arcs = this.data.map((d, i) => {
      const sweep = (d.value / this.total) * 360;
      const endDeg = startDeg + sweep;
      // avoid full 360 circle (single slice) — offset by tiny amount
      const safEnd = sweep >= 359.99 ? startDeg + 359.99 : endDeg;
      const path = arcPath(this.CX, this.CY, this.R, this.RI, startDeg, safEnd);
      const arc: Arc = {
        path,
        color: COLORS[i % COLORS.length],
        label: d.label,
        value: d.value,
        pct: Math.round((d.value / this.total) * 100),
      };
      startDeg = endDeg;
      return arc;
    });
  }
}

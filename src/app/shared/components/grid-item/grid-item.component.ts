import { CommonModule } from '@angular/common';
import { Component, inject, Input, SimpleChange } from '@angular/core';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-grid-item',
  standalone: true,
  imports: [CommonModule, DateFormatPipe],
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.scss',
})
export class GridItemComponent {
  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  public draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;
  private readonly dateFormat = inject(DateFormatPipe);
  dragStart(e: any, index: number) {
    this.draggedIndex = index;
    e.currentTarget.closest('tr').classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  dragOver(e: any, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.dragOverIndex = index;
  }

  dragLeave(e: any) {
    this.dragOverIndex = null;
  }

  drop(e: any, index: number) {
    e.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      this.reorderData(this.draggedIndex, index);
    }
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  dragEnd(e: any) {
    e.currentTarget.closest('tr').classList.remove('is-dragging');
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  private reorderData(fromIndex: number, toIndex: number) {
    const items = [...this.data];
    const [draggedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, draggedItem);
    this.data = items;
  }
  ngOnChanges(change: SimpleChange) {
    const value = change as any;
    if (value['data']?.currentValue.length > 0) {
      debugger;

      const data = value['data'];
      let i = 0;
      for (const dt of Object.assign(data)) {
        if (dt.toUpperCase() === 'DATE') {
          this.dateFormat.transform(dt[i]);
        }
        i++;
      }
    }
  }
}

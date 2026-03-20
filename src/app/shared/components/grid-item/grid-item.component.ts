import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { ColumnSettings } from '../../models/column-settings.model';

export interface GridPageChangeEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-grid-item',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFormatPipe],
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.scss',
})
export class GridItemComponent {
  @Input() columns: ColumnSettings[] = [];
  @Input() data: any[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalCount: number | null = null;
  @Input() hasNextPage = false;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  public draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;
  public selectedItem: number = 0;
  @Output() selectedClick = new EventEmitter();
  @Output() pageChange = new EventEmitter<GridPageChangeEvent>();

  ngOnInit() {
    console.log('Column', this.columns);
  }
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
    if (this.selectedItem === this.draggedIndex) this.selectedItem = index;
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
  ngOnChanges(change: SimpleChanges) {}
  selected(item: any, index: number) {
    console.log('item', item);
    this.selectedItem = index;
    this.selectedClick.emit(item);
  }

  isActionColumn(col: ColumnSettings): boolean {
    return col.type === 'action';
  }

  getCellValue(item: any, col: ColumnSettings): unknown {
    if (!col.field) {
      return '';
    }

    return item?.[col.field];
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.pageChange.emit({ page: this.currentPage - 1, pageSize: this.pageSize });
  }

  nextPage(): void {
    if (!this.hasNextPage && this.currentPage >= this.totalPages) {
      return;
    }

    this.pageChange.emit({ page: this.currentPage + 1, pageSize: this.pageSize });
  }

  onPageSizeChange(value: string | number): void {
    const pageSize = Number(value);

    if (!Number.isFinite(pageSize) || pageSize <= 0 || pageSize === this.pageSize) {
      return;
    }

    this.pageChange.emit({ page: 1, pageSize });
  }
}

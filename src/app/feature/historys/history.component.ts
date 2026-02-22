import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GridItemComponent } from '../../shared/components/grid-item/grid-item.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, GridItemComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  public columns = [
    {
      text: 'Date',
      // width: 150,
    },
    {
      text: 'Task',
      // width: 450,
    },
    {
      text: 'Project',
      // width: 100,
    },
    {
      text: 'Status',
      // width: 100,
    },
    {
      text: 'Duration',
      // width: 150,
    },
    {
      text: 'action',
    },
  ];
  public data = [
    {
      Date: new Date().toLocaleDateString(),
      Task: 'Google management',
      Project: 'ATS',
      Duration: '8 ชั่วโมง',
    },
    {
      Date: new Date().toLocaleDateString(),
      Task: 'Compare Candidate',
      Project: 'ATS',
      Duration: '8 ชั่วโมง',
    },
    {
      Date: new Date().toLocaleDateString(),
      Task: 'Assign Job',
      Project: 'ATS',
      Duration: '8 ชั่วโมง',
    },
  ];
}

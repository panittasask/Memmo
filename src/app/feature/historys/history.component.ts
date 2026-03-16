import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { GridItemComponent } from '../../shared/components/grid-item/grid-item.component';
import { HistoryService } from '../../shared/services/history.service';
import { firstValueFrom } from 'rxjs';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerDirective } from '../../shared/directive/input-date.directive';
import { ColumnSettings } from '../../shared/models/column-settings.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, GridItemComponent,ReactiveFormsModule,FormsModule,DatePickerDirective],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {

  private readonly HistoryService = inject(HistoryService);
   formUpdate = new FormGroup({
      id:new FormControl('',[Validators.required]),
      date:new FormControl('',[Validators.required]),
      time:new FormControl(0),
      description:new FormControl(''),
      projectName:new FormControl('',[Validators.required]),
      taskName: new FormControl('',[Validators.required]) ,
      status:new FormControl('')
    });

  constructor(){
    effect(()=>{
      if(this.HistoryService.refreshTrigger() > 0){
        this.fetchData();
      }
    })
  }
  public selectedData: object = {};
  public isShowDetail = false;
  public filterDate = this.getToday();
  public isAllFilter = false;
  public columns: ColumnSettings[] = [
    {
      field: 'startDate',
      text: 'วันที่',
      type: 'date',
      width: 80,
    },
    {
      field: 'taskName',
      type: 'text',
      text: 'งาน',
      width: 280,
    },
    {
      field: 'projectName',
      type: 'text',
      text: 'โปรเจกต์',
      width: 100,
    },
    {
      field: 'status',
      type: 'text',
      text: 'สถานะ',
      width: 80,
    },
    {
      field: 'duration',
      type: 'number',
      text: 'ระยะเวลา',
      width: 80,
    },
    {
      type: 'action',
      text: 'จัดการ',
      width: 80,
    },
  ];
  public data: any[] = [];
  private allData: any[] = [];

  selectedItem(item: any) {
    this.formUpdate.patchValue({
      id:item.id,
      date:this.getDate(item.startDate),
      description:item.description,
      time:item.duration,
      projectName:item.projectName,
      taskName: item.taskName,
      status:item.status
    });
    this.selectedData = item;
    this.isShowDetail = true;
  }
  async fetchData(){
    try{
      this.allData = await firstValueFrom(this.HistoryService.getTask()) as any[];
      this.applyDateFilter();
    }catch(ex:any){
      console.log("Error >>",ex)
    }
  }

  onFilterDateChange(value: string) {
    this.isAllFilter = false;
    this.filterDate = value || this.getToday();
    this.applyDateFilter();
  }

  setTodayFilter() {
    this.isAllFilter = false;
    this.filterDate = this.getToday();
    this.applyDateFilter();
  }

  setAllFilter() {
    this.isAllFilter = true;
    this.data = [...this.allData];
  }

  private applyDateFilter() {
    if (this.isAllFilter) {
      this.data = [...this.allData];
      return;
    }

    const selectedDateKey = this.filterDate;
    this.data = this.allData.filter((item) => {
      const itemDateKey = this.getDate(item?.startDate);
      return itemDateKey === selectedDateKey;
    });
  }
  async ngOnInit(){
    await this.fetchData();
  }
  async onSave(){
    if(!this.formUpdate.valid) return;
        const value:any = this.formUpdate.getRawValue();
    const model = {
        id:value.id,
        duration: value.time,
        projectName: value.projectName,
        taskName: value.taskName,
        description: value.description,
        status: value.status,
        startDate: new Date(value.date),
    };
    try{
      const result = await firstValueFrom(this.HistoryService.updateTask(model));
      if(result){
        console.log("result");
        this.isShowDetail = false;
        this.fetchData();
      }
    }catch(ex:any){
      console.log("Error >>>",ex)
    }
  }
   private getDate(date:any): string {
    const today = new Date(date);
    if (Number.isNaN(today.getTime())) {
      return '';
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getToday(): string {
    return this.getDate(new Date());
  }
}

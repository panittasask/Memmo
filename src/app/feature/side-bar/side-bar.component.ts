import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerDirective } from '../../shared/directive/input-date.directive';
import { firstValueFrom } from 'rxjs';
import { HistoryService } from '../../shared/services/history.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule,DatePickerDirective],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  private readonly historyService = inject(HistoryService);

  formAddNew = new FormGroup({
    date:new FormControl(this.getToday(),[Validators.required]),
    time:new FormControl(0),
    description:new FormControl(''),
    projectName:new FormControl('',[Validators.required]),
    taskName: new FormControl('',[Validators.required]) ,
    status:new FormControl('')
  });
  private getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  public currentRoute = 'history';
  private readonly routes = inject(Router);
  isAddNew:boolean = false;
  ngOnInit() {
    this.routes.navigate([this.currentRoute]);
  }
  navigate(route: string) {
    this.currentRoute = route;
    this.routes.navigate([route]);
  }
  onAddNew(){
    this.isAddNew = true;
  }
  async onSave(){
    if(!this.formAddNew.valid){
      return;
    }
    const value:any = this.formAddNew.getRawValue();
    const model = {
        duration: value.time,
        projectName: value.projectName,
        taskName: value.taskName,
        description: value.description,
        status: value.status,
        startDate: new Date(value.date)
    };
    try{
      const result = await firstValueFrom(this.historyService.addNewTask(model));
      if(result){
        console.log("result");
        this.isAddNew = false;
        this.historyService.notifyDataChanged();
      }
    }catch(ex:any){
      console.log("Error >>>",ex)
    }
  }

}

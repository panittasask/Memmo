import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatepickerComponent } from '../../shared/components/datepicker/datepicker.component';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';
import { firstValueFrom } from 'rxjs';
import { HistoryService } from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';
import { DropdownChildItem, SettingsService } from '../../shared/services/settings.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatepickerComponent, DropdownListComponent],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  private readonly historyService = inject(HistoryService);
  private readonly toast = inject(ToastService);
  private readonly settingsService = inject(SettingsService);

  saveInProcess:boolean = false;

  projectOptions: DropdownChildItem[] = [];
  statusOptions: DropdownChildItem[] = [];

  constructor(){
    effect(()=>{
      if(this.settingsService.refreshTrigger() > 0){
        this.loadSettings();
      }
    })
  }

  get projectOptionNames(): string[] {
    return this.projectOptions.map(o => o.name);
  }

  get statusOptionNames(): string[] {
    return this.statusOptions.map(o => o.name);
  }

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
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const res = await firstValueFrom(this.settingsService.getSettings());
      const parents = res.parents ?? [];
      const children = res.children ?? [];
      const projectParent = parents.find(p => p.key === 'project');
      const statusParent = parents.find(p => p.key === 'status');
      this.projectOptions = projectParent ? children.filter(c => c.parentId === projectParent.id) : [];
      this.statusOptions = statusParent ? children.filter(c => c.parentId === statusParent.id) : [];
    } catch {
      this.projectOptions = [];
      this.statusOptions = [];
    }
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
    this.saveInProcess = true;
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
        this.saveInProcess = false;
        this.toast.success('เพิ่มงานใหม่สำเร็จ');
        this.isAddNew = false;
        // this.formAddNew.reset();
        this.formAddNew.patchValue({
          date: this.getToday(),
          time:0,
          description:'',
          projectName:'',
          taskName: '',
          status:''
        });
        this.historyService.notifyDataChanged();
      }
    }catch(ex:any){
      this.saveInProcess = false;
      this.toast.error('ไม่สามารถเพิ่มงานได้', { detail: ex?.error ?? ex?.message ?? String(ex) });
      console.log("Error >>>",ex)
    }
  }

}

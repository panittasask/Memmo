import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";

@Injectable({
  providedIn:'root'  
})
export class HistoryService{
    private readonly http = inject(HttpClient);
    private refreshSignal = signal<number>(0);

    get refreshTrigger() {
      return this.refreshSignal.asReadonly();
    }
    notifyDataChanged() {
      this.refreshSignal.update(value => value + 1);
    }
    getTask(){
        const url = 'http://localhost:5065/History';
        return this.http.get(url);
    }
    addNewTask(model:any){
        const url = 'http://localhost:5065/History/AddNew';
        return this.http.post(url,model);
    }
    updateTask(model:any){
        const url = 'http://localhost:5065/History/Update';
        return this.http.post(url,model);
    }
} 
import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { AppConfigService } from "./app-config.service";

@Injectable({
  providedIn:'root'  
})
export class HistoryService{
    private readonly http = inject(HttpClient);
    private readonly appConfig = inject(AppConfigService);
    private refreshSignal = signal<number>(0);

    private get baseUrl(): string {
      return this.appConfig.getApiBaseUrl();
    }

    get refreshTrigger() {
      return this.refreshSignal.asReadonly();
    }
    notifyDataChanged() {
      this.refreshSignal.update(value => value + 1);
    }
    getTask(){
      const url = `${this.baseUrl}/History`;
        return this.http.get(url);
    }
    addNewTask(model:any){
      const url = `${this.baseUrl}/History/AddNew`;
        return this.http.post(url,model);
    }
    updateTask(model:any){
      const url = `${this.baseUrl}/History/Update`;
        return this.http.post(url,model);
    }
} 
import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { AppConfigService } from "./app-config.service";

export interface HistoryQueryRequest {
  page: number;
  pageSize: number;
  filterDate?: string;
  isAllFilter?: boolean;
  nameType?: string;
}

export interface HistoryPagedResult<T> {
  items: T[];
  totalCount?: number;
  totalRows?: number;
  totalRecords?: number;
  rowCount?: number;
  totalPages?: number;
  page?: number;
  currentPage?: number;
  pageSize?: number;
  hasNext?: boolean;
}

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
    getTask(query: HistoryQueryRequest){
      const url = `${this.baseUrl}/History`;
      return this.http.post<HistoryPagedResult<any> | any[]>(url, query);
    }
    addNewTask(model:any){
      const url = `${this.baseUrl}/History/AddNew`;
        return this.http.post(url,model);
    }
    updateTask(model:any){
      const url = `${this.baseUrl}/History/Update`;
        return this.http.post(url,model);
    }

    deleteTask(id: string) {
      const url = `${this.baseUrl}/History/task/${id}`;
      return this.http.delete(url);
    }
} 
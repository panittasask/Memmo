import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { AppConfigService } from "./app-config.service";

export interface HistoryQueryRequest {
  page: number;
  pageSize: number;
  filterDate?: string;
  isAllFilter?: boolean;
  nameType?: string;
  status?: string;
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
      return this.http.post<HistoryPagedResult<any> | any[]>(url, this.toQueryPayload(query));
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

    summaryToday(date?: string) {
      const url = `${this.baseUrl}/Dashboard/summarytoday`;
      return this.http.post<any>(url, date ? { date } : {});
    }

    private toQueryPayload(query: HistoryQueryRequest): Partial<HistoryQueryRequest> {
      const payload: Partial<HistoryQueryRequest> = { ...query };
      Object.keys(payload).forEach((key) => {
        const value = payload[key as keyof HistoryQueryRequest];
        if (value === null || value === undefined || value === '') {
          delete payload[key as keyof HistoryQueryRequest];
        }
      });
      return payload;
    }
} 
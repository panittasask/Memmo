import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { AppConfigService } from "./app-config.service";

export interface DropdownParentItem {
  id: string;
  key: string;
  name: string;
}

export interface DropdownChildItem {
  id: string;
  parentId: string;
  key: string;
  name: string;
}

export interface SettingsResponse {
  parents: DropdownParentItem[];
  children: DropdownChildItem[];
}

export interface UpdateParentSettingRequest {
  id: string;
  key: string;
  name: string;
}

export interface UpdateChildSettingRequest {
  id: string;
  parentId: string;
  key: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
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

  getSettings() {
    const url = `${this.baseUrl}/Settings/settings`;
    return this.http.get<SettingsResponse>(url);
  }

  updateParent(model: UpdateParentSettingRequest) {
    const url = `${this.baseUrl}/Settings/settings/parent`;
    return this.http.post<DropdownParentItem>(url, model);
  }

  updateChild(model: UpdateChildSettingRequest) {
    const url = `${this.baseUrl}/Settings/settings/child`;
    return this.http.post<DropdownChildItem>(url, model);
  }

  deleteParent(id: string) {
    const url = `${this.baseUrl}/Settings/settings/parent/delete/${id}`;
    return this.http.post(url, {});
  }

  deleteChild(id: string) {
    const url = `${this.baseUrl}/Settings/settings/child/delete/${id}`;
    return this.http.post(url, {});
  }
}

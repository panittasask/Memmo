import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface WorkflowItem {
  id: number;
  name: string;
  description: string;
}

export interface WorkflowNodeItem {
  id: number;
  nodeType: string;
  taskId?: number | null;
  customName?: string | null;
  childNodeIds?: number[];
}

export interface WorkflowEdgeItem {
  id: number;
  fromNodeId: number;
  toNodeId: number;
}

export interface WorkflowDetailItem {
  workflow: WorkflowItem;
  nodes: WorkflowNodeItem[];
  edges: WorkflowEdgeItem[];
}

export interface WorkflowSyncNodeItem {
  clientNodeId: string;
  nodeType: 'Task' | 'Custom';
  taskId?: number | null;
  customName?: string | null;
}

export interface WorkflowSyncEdgeItem {
  fromClientNodeId: string;
  toClientNodeId: string;
}

export interface WorkflowSyncRequest {
  nodes: WorkflowSyncNodeItem[];
  edges: WorkflowSyncEdgeItem[];
  replaceExistingEdges?: boolean;
}

export interface WorkflowSyncResult {
  createdNodes: number;
  createdEdges: number;
  deletedEdges: number;
  skippedEdges: number;
  warnings: string[];
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService,
  ) {}

  private get baseUrl(): string {
    return `${this.appConfig.getApiBaseUrl()}/workflow`;
  }

  createWorkflow(data: {
    name: string;
    description: string;
  }): Observable<WorkflowItem> {
    return this.http.post<WorkflowItem>(this.baseUrl, data);
  }

  updateWorkflow(
    id: number,
    data: { name: string; description: string },
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  deleteWorkflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getWorkflowList(): Observable<WorkflowItem[]> {
    return this.http.get<WorkflowItem[]>(this.baseUrl);
  }

  getWorkflowDetail(id: number): Observable<WorkflowDetailItem> {
    return this.http.get<WorkflowDetailItem>(`${this.baseUrl}/${id}`);
  }

  createNode(
    workflowId: number,
    data: {
      nodeType: string;
      taskId?: number | null;
      customName?: string | null;
    },
  ): Observable<WorkflowNodeItem> {
    return this.http.post<WorkflowNodeItem>(
      `${this.baseUrl}/${workflowId}/nodes`,
      data,
    );
  }

  updateNode(
    workflowId: number,
    nodeId: number,
    data: {
      nodeType: string;
      taskId?: number | null;
      customName?: string | null;
    },
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${workflowId}/nodes/${nodeId}`,
      data,
    );
  }

  deleteNode(workflowId: number, nodeId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${workflowId}/nodes/${nodeId}`,
    );
  }

  createEdge(
    workflowId: number,
    data: { fromNodeId: number; toNodeId: number },
  ): Observable<WorkflowEdgeItem> {
    return this.http.post<WorkflowEdgeItem>(
      `${this.baseUrl}/${workflowId}/edges`,
      data,
    );
  }

  deleteEdge(workflowId: number, edgeId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${workflowId}/edges/${edgeId}`,
    );
  }

  syncGraph(
    workflowId: number,
    data: WorkflowSyncRequest,
  ): Observable<WorkflowSyncResult> {
    return this.http.post<WorkflowSyncResult>(
      `${this.baseUrl}/${workflowId}/sync`,
      data,
    );
  }
}

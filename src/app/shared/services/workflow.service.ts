import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private http: HttpClient) {}

  createWorkflow(data: { name: string; description: string }): Observable<any> {
    return this.http.post('/api/workflow', data);
  }

  updateWorkflow(id: number, data: { name: string; description: string }): Observable<any> {
    return this.http.put(`/api/workflow/${id}`, data);
  }

  deleteWorkflow(id: number): Observable<any> {
    return this.http.delete(`/api/workflow/${id}`);
  }

  getWorkflowList(): Observable<any> {
    return this.http.get('/api/workflow');
  }

  getWorkflowDetail(id: number): Observable<any> {
    return this.http.get(`/api/workflow/${id}`);
  }

  createNode(workflowId: number, data: any): Observable<any> {
    return this.http.post(`/api/workflow/${workflowId}/nodes`, data);
  }

  updateNode(workflowId: number, nodeId: number, data: any): Observable<any> {
    return this.http.put(`/api/workflow/${workflowId}/nodes/${nodeId}`, data);
  }

  deleteNode(workflowId: number, nodeId: number): Observable<any> {
    return this.http.delete(`/api/workflow/${workflowId}/nodes/${nodeId}`);
  }

  createEdge(workflowId: number, data: { fromNodeId: number; toNodeId: number }): Observable<any> {
    return this.http.post(`/api/workflow/${workflowId}/edges`, data);
  }

  deleteEdge(workflowId: number, edgeId: number): Observable<any> {
    return this.http.delete(`/api/workflow/${workflowId}/edges/${edgeId}`);
  }
}

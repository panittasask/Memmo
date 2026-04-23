import { CommonModule, DOCUMENT } from '@angular/common';
import {
  WorkflowItem,
  WorkflowService,
} from '../../shared/services/workflow.service';
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HistoryService,
  HistoryPagedResult,
  HistoryQueryRequest,
} from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  DropdownChildItem,
  SettingsService,
} from '../../shared/services/settings.service';
import { DropdownListComponent } from '../../shared/components/dropdown-list/dropdown-list.component';

interface WorkflowTask {
  id: string;
  startDate: string;
  taskName: string;
  projectName: string;
  status: string;
  duration: number;
  description?: string;
  hyperlink?: string;
}

interface WFNode {
  id: string;
  x: number;
  y: number;
  backendNodeId?: number;
  /** 'task' = pulled from history, 'custom' = user-created free-text box */
  type: 'task' | 'custom';
  task?: WorkflowTask;
  label: string; // custom node title
  note: string; // custom node body text
}

interface WFConnection {
  id: string;
  backendEdgeId?: number;
  fromNodeId: string;
  toNodeId: string;
}

const NODE_W = 230;
const NODE_H = 95;
const CUSTOM_NODE_W = 230;
const TASKS_PER_PAGE = 10;

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownListComponent],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
})
export class WorkflowComponent implements OnInit {
  private readonly historyService = inject(HistoryService);
  private readonly toast = inject(ToastService);
  private readonly workflowService = inject(WorkflowService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly document = inject(DOCUMENT);

  workflowId: number | null = null;

  workflows: WorkflowItem[] = [];
  selectedWorkflowId: number | null = null;
  isWorkflowLoading = false;

  tasks: WorkflowTask[] = [];
  nodes: WFNode[] = [];
  connections: WFConnection[] = [];

  selectedTask: WorkflowTask | null = null;
  modalTask: WorkflowTask | null = null;
  isTaskDetailModalOpen = false;
  searchText = '';
  selectedStatus = 'all';
  readonly taskPageSize = TASKS_PER_PAGE;
  taskCurrentPage = 1;
  totalTaskPages = 1;
  totalTaskCount: number | null = null;
  hasNextTaskPage = false;
  statusOptions: DropdownChildItem[] = [];

  panX = 0;
  panY = 0;
  zoom = 1;

  draggingNode: WFNode | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;

  drawingConn: {
    fromNodeId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null = null;

  isPanning = false;
  panStartX = 0;
  panStartY = 0;

  readonly NODE_W = NODE_W;
  readonly NODE_H = NODE_H;
  readonly CUSTOM_NODE_W = CUSTOM_NODE_W;

  private draggingTask: WorkflowTask | null = null;

  @ViewChild('canvasWrapper') canvasWrapperEl!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.document.body.classList.add('workflow-dropdown-theme-active');
    void this.initialize();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('workflow-dropdown-theme-active');
  }

  private async initialize(): Promise<void> {
    await this.loadSettings();
    await this.loadTasks();
    await this.loadWorkflowCatalog();
    await this.focusTaskFromRoute();
  }

  selectWorkflow(workflow: WorkflowItem): void {
    this.selectedWorkflowId = workflow.id;
    void this.loadWorkflowById(workflow.id, true);
  }

  get statusFilterOptions(): string[] {
    return ['all', ...this.statusOptions.map((o) => o.name)];
  }

  getStatusColor(status: string): string {
    const color = this.statusOptions.find(
      (o) =>
        (o.name ?? '').trim().toLowerCase() ===
        (status ?? '').trim().toLowerCase(),
    )?.color;
    return color || '#63b3ed';
  }

  getStatusBackgroundColor(status: string): string {
    return `${this.getStatusColor(status)}26`;
  }

  get displayedTasks(): WorkflowTask[] {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) {
      return this.tasks;
    }
    return this.tasks.filter((task) => {
      const taskName = (task.taskName ?? '').toLowerCase();
      const projectName = (task.projectName ?? '').toLowerCase();
      const status = (task.status ?? '').toLowerCase();
      return (
        taskName.includes(keyword) ||
        projectName.includes(keyword) ||
        status.includes(keyword)
      );
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const res = await firstValueFrom(this.settingsService.getSettings());
      const parents = res.parents ?? [];
      const children = res.children ?? [];
      const statusParent = parents.find((p) => p.key === 'status');
      this.statusOptions = statusParent
        ? children.filter((c) => c.parentId === statusParent.id)
        : [];
    } catch {
      this.statusOptions = [];
    }
  }

  async loadTasks(page: number = this.taskCurrentPage): Promise<void> {
    try {
      const req: HistoryQueryRequest = {
        page,
        pageSize: this.taskPageSize,
        isAllFilter: true,
        status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      };
      const res = await firstValueFrom(this.historyService.getTask(req));
      const normalized = this.normalizePagedResponse(res);
      this.tasks = normalized.items;
      this.taskCurrentPage = normalized.currentPage;
      this.totalTaskPages = normalized.totalPages;
      this.totalTaskCount = normalized.totalCount;
      this.hasNextTaskPage = normalized.hasNextPage;

      if (
        this.selectedTask &&
        !this.tasks.some((task) => task.id === this.selectedTask?.id)
      ) {
        this.selectedTask = null;
      }
    } catch (ex: any) {
      this.toast.error('ไม่สามารถโหลด task ได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  onSearchChanged(): void {
    // client-side search on current page
  }

  async onStatusChanged(value: string | number): Promise<void> {
    this.selectedStatus = String(value || 'all');
    this.taskCurrentPage = 1;
    await this.loadTasks(1);
  }

  async previousTaskPage(): Promise<void> {
    if (this.taskCurrentPage > 1) {
      await this.loadTasks(this.taskCurrentPage - 1);
    }
  }

  async nextTaskPage(): Promise<void> {
    if (this.taskCurrentPage < this.totalTaskPages || this.hasNextTaskPage) {
      await this.loadTasks(this.taskCurrentPage + 1);
    }
  }

  selectTask(task: WorkflowTask): void {
    this.selectedTask = task;
    void this.loadWorkflowByTask(task.id, true);
  }

  private normalizePagedResponse(
    response: HistoryPagedResult<WorkflowTask> | WorkflowTask[],
  ): {
    items: WorkflowTask[];
    currentPage: number;
    totalPages: number;
    totalCount: number | null;
    hasNextPage: boolean;
  } {
    if (Array.isArray(response)) {
      return {
        items: response,
        currentPage: this.taskCurrentPage,
        totalPages:
          response.length < this.taskPageSize
            ? this.taskCurrentPage
            : this.taskCurrentPage + 1,
        totalCount: null,
        hasNextPage: response.length === this.taskPageSize,
      };
    }

    const items = response.items ?? [];
    const currentPage =
      response.currentPage ?? response.page ?? this.taskCurrentPage;
    const totalCount =
      response.totalCount ??
      response.totalRows ??
      response.totalRecords ??
      response.rowCount ??
      null;
    const pageSize = response.pageSize ?? this.taskPageSize;
    const totalPages =
      response.totalPages ??
      (typeof totalCount === 'number'
        ? Math.max(1, Math.ceil(totalCount / pageSize))
        : items.length < pageSize
          ? currentPage
          : currentPage + 1);
    const hasNextPage =
      response.hasNext ??
      (typeof response.totalPages === 'number'
        ? currentPage < response.totalPages
        : items.length === pageSize);

    return {
      items,
      currentPage,
      totalPages,
      totalCount,
      hasNextPage,
    };
  }

  goToTaskDetail(): void {
    if (!this.modalTask?.id) {
      return;
    }
    void this.router.navigate(['/history'], {
      queryParams: { taskId: this.modalTask.id },
    });
  }

  isOnCanvas(task: WorkflowTask): boolean {
    return this.nodes.some((n) => n.type === 'task' && n.task?.id === task.id);
  }

  addNodeFromTask(task: WorkflowTask) {
    this.selectTask(task);
    if (this.isOnCanvas(task)) return;
    const i = this.nodes.length;
    this.nodes.push({
      id: `node-${task.id}`,
      x: 80 + (i % 3) * 270,
      y: 60 + Math.floor(i / 3) * 160,
      type: 'task',
      task,
      label: task.taskName,
      note: '',
    });
  }

  addCustomNode() {
    const i = this.nodes.length;
    this.nodes.push({
      id: `custom-${Date.now()}`,
      x: 100 + (i % 3) * 260,
      y: 80 + Math.floor(i / 3) * 180,
      type: 'custom',
      label: 'Custom Box',
      note: '',
    });
  }

  removeNode(nodeId: string, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    this.connections = this.connections.filter(
      (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId,
    );
  }

  removeConnection(connId: string) {
    this.connections = this.connections.filter((c) => c.id !== connId);
  }

  clearCanvas() {
    this.nodes = [];
    this.connections = [];
  }

  // ── Node drag ──────────────────────────────────────────
  onNodeMouseDown(e: MouseEvent, node: WFNode) {
    const target = e.target as HTMLElement;
    if (
      target.closest(
        '.port, .node-delete, .custom-label, .custom-note, .node-open-detail',
      )
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    this.draggingNode = node;
    const p = this.screenToInner(e.clientX, e.clientY);
    this.dragOffsetX = p.x - node.x;
    this.dragOffsetY = p.y - node.y;
  }

  // ── Connection drawing ─────────────────────────────────
  onOutputPortMouseDown(e: MouseEvent, node: WFNode) {
    e.preventDefault();
    e.stopPropagation();
    const p = this.screenToInner(e.clientX, e.clientY);
    const nodeW = node.type === 'custom' ? CUSTOM_NODE_W : NODE_W;
    this.drawingConn = {
      fromNodeId: node.id,
      fromX: node.x + nodeW,
      fromY: node.y + NODE_H / 2,
      toX: p.x,
      toY: p.y,
    };
  }

  onInputPortMouseUp(e: MouseEvent, node: WFNode) {
    if (!this.drawingConn || this.drawingConn.fromNodeId === node.id) {
      this.drawingConn = null;
      return;
    }
    const alreadyExists = this.connections.some(
      (c) =>
        c.fromNodeId === this.drawingConn!.fromNodeId && c.toNodeId === node.id,
    );
    if (!alreadyExists) {
      this.connections.push({
        id: `conn-${Date.now()}`,
        fromNodeId: this.drawingConn.fromNodeId,
        toNodeId: node.id,
      });
    }
    this.drawingConn = null;
  }

  // ── Canvas panning: left-click drag on canvas background ──
  onCanvasMouseDown(e: MouseEvent) {
    // middle or right button also works
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      e.preventDefault();
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.draggingNode) {
      const p = this.screenToInner(e.clientX, e.clientY);
      this.draggingNode.x = p.x - this.dragOffsetX;
      this.draggingNode.y = p.y - this.dragOffsetY;
    } else if (this.drawingConn) {
      const p = this.screenToInner(e.clientX, e.clientY);
      this.drawingConn.toX = p.x;
      this.drawingConn.toY = p.y;
    } else if (this.isPanning) {
      this.panX = e.clientX - this.panStartX;
      this.panY = e.clientY - this.panStartY;
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.draggingNode = null;
    this.drawingConn = null;
    this.isPanning = false;
  }

  onCanvasWheel(e: WheelEvent) {
    e.preventDefault();
    const rect = this.canvasWrapperEl.nativeElement.getBoundingClientRect();
    const mouseInnerX = (e.clientX - rect.left - this.panX) / this.zoom;
    const mouseInnerY = (e.clientY - rect.top - this.panY) / this.zoom;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(this.zoom * factor, 0.15), 4);
    this.panX = e.clientX - rect.left - mouseInnerX * newZoom;
    this.panY = e.clientY - rect.top - mouseInnerY * newZoom;
    this.zoom = newZoom;
  }

  // ── Helpers ────────────────────────────────────────────
  private screenToInner(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const rect =
      this.canvasWrapperEl?.nativeElement.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
      };
    return {
      x: (clientX - rect.left - this.panX) / this.zoom,
      y: (clientY - rect.top - this.panY) / this.zoom,
    };
  }

  get canvasTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  get zoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  get cursorStyle(): string {
    if (this.draggingNode) return 'grabbing';
    if (this.isPanning) return 'grabbing';
    return 'grab';
  }

  connPath(conn: WFConnection): string {
    const from = this.nodes.find((n) => n.id === conn.fromNodeId);
    const to = this.nodes.find((n) => n.id === conn.toNodeId);
    if (!from || !to) return '';
    // คำนวณจุดศูนย์กลางของ port-out (ขวา) และ port-in (ซ้าย)
    const fromW = from.type === 'custom' ? CUSTOM_NODE_W : NODE_W;
    const fromPortOutX = from.x + fromW - 8 + 7; // left + width - 8px (port offset) + 7px (port radius)
    const fromPortOutY = from.y + NODE_H / 2;
    const toPortInX = to.x - 8 + 7; // left - 8px (port offset) + 7px (port radius)
    const toPortInY = to.y + NODE_H / 2;
    return this.bezier(fromPortOutX, fromPortOutY, toPortInX, toPortInY);
  }

  drawingPath(): string {
    if (!this.drawingConn) return '';
    const { fromX, fromY, toX, toY } = this.drawingConn;
    return this.bezier(fromX, fromY, toX, toY);
  }

  private bezier(x1: number, y1: number, x2: number, y2: number): string {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  }

  connMid(conn: WFConnection): { x: number; y: number } {
    const from = this.nodes.find((n) => n.id === conn.fromNodeId);
    const to = this.nodes.find((n) => n.id === conn.toNodeId);
    if (!from || !to) return { x: 0, y: 0 };
    const fromW = from.type === 'custom' ? CUSTOM_NODE_W : NODE_W;
    return {
      x: (from.x + fromW + to.x) / 2,
      y: (from.y + NODE_H / 2 + to.y + NODE_H / 2) / 2,
    };
  }

  // Drag & Drop Task from Panel

  onTaskDragStart(event: DragEvent, task: WorkflowTask) {
    this.draggingTask = task;
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onTaskDragEnd(_: DragEvent) {
    this.draggingTask = null;
  }

  onCanvasDragOver(event: DragEvent) {
    // Allow drop
    event.preventDefault();
  }

  onCanvasDrop(event: DragEvent) {
    event.preventDefault();
    if (!this.draggingTask) return;
    this.selectedTask = this.draggingTask;
    // Get drop position relative to canvas
    const rect = this.canvasWrapperEl.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.panX) / this.zoom;
    const y = (event.clientY - rect.top - this.panY) / this.zoom;
    // Add node at drop position
    if (!this.isOnCanvas(this.draggingTask)) {
      this.nodes.push({
        id: `node-${this.draggingTask.id}`,
        x,
        y,
        type: 'task',
        task: this.draggingTask,
        label: this.draggingTask.taskName,
        note: '',
      });
    }
    this.draggingTask = null;
  }

  onNodeTaskClick(event: MouseEvent, node: WFNode): void {
    event.stopPropagation();
    if (node.type !== 'task' || !node.task) {
      return;
    }
  }

  openTaskDetailModal(event: MouseEvent, node: WFNode): void {
    event.stopPropagation();
    event.preventDefault();
    if (node.type !== 'task' || !node.task) {
      return;
    }
    this.modalTask = node.task;
    this.isTaskDetailModalOpen = true;
  }

  closeTaskDetailModal(): void {
    this.isTaskDetailModalOpen = false;
    this.modalTask = null;
  }

  private async focusTaskFromRoute(): Promise<void> {
    const taskId = this.activatedRoute.snapshot.queryParamMap.get('taskId');
    if (!taskId) {
      return;
    }

    await this.loadWorkflowByTask(taskId, true);

    const task = this.tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    this.selectTask(task);
    if (!this.isOnCanvas(task)) {
      this.addNodeFromTask(task);
    }
  }

  private parseTaskId(taskId?: string): number | null {
    if (!taskId) return null;
    const value = Number(taskId);
    return Number.isFinite(value) ? value : null;
  }

  private async loadWorkflowCatalog(): Promise<void> {
    try {
      const workflowList = await firstValueFrom(
        this.workflowService.getWorkflowList(),
      );
      this.workflows = [...workflowList].sort((a, b) => a.id - b.id);
      if (!this.selectedWorkflowId && this.workflows.length > 0) {
        this.selectedWorkflowId = this.workflows[0].id;
      }
    } catch (ex: any) {
      this.toast.error('โหลด workflow list ไม่สำเร็จ', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  private resetCanvasForWorkflowLoad(): void {
    this.nodes = [];
    this.connections = [];
    this.selectedTask = null;
    this.modalTask = null;
    this.isTaskDetailModalOpen = false;
  }

  private async loadWorkflowById(
    workflowId: number,
    resetViewport: boolean = false,
  ): Promise<void> {
    this.isWorkflowLoading = true;
    this.resetCanvasForWorkflowLoad();
    if (resetViewport) {
      this.panX = 0;
      this.panY = 0;
      this.zoom = 1;
    }

    try {
      const detail = await firstValueFrom(
        this.workflowService.getWorkflowDetail(workflowId),
      );
      await this.loadWorkflowTasksForHydration(detail.nodes ?? []);
      this.workflowId = detail.workflow?.id ?? workflowId;
      this.selectedWorkflowId = this.workflowId;
      this.hydrateCanvasFromWorkflow(detail.nodes ?? [], detail.edges ?? []);
      this.centerLoadedWorkflow();
    } catch (ex: any) {
      this.toast.error('โหลด workflow ไม่สำเร็จ', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    } finally {
      this.isWorkflowLoading = false;
    }
  }

  private async loadWorkflowByTask(
    taskId: string,
    resetViewport: boolean = false,
  ): Promise<void> {
    const normalizedTaskId = String(taskId ?? '').trim();
    if (!normalizedTaskId) {
      return;
    }

    this.isWorkflowLoading = true;
    this.resetCanvasForWorkflowLoad();
    if (resetViewport) {
      this.panX = 0;
      this.panY = 0;
      this.zoom = 1;
    }

    try {
      const detail = await firstValueFrom(
        this.workflowService.getWorkflowByTask(normalizedTaskId),
      );
      await this.loadWorkflowTasksForHydration(detail.nodes ?? []);
      this.workflowId = detail.workflow?.id ?? null;
      this.selectedWorkflowId = this.workflowId;
      this.hydrateCanvasFromWorkflow(detail.nodes ?? [], detail.edges ?? []);
      this.centerLoadedWorkflow();
    } catch (ex: any) {
      this.toast.error('โหลด workflow จาก task ไม่สำเร็จ', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    } finally {
      this.isWorkflowLoading = false;
    }
  }

  private async loadWorkflowTasksForHydration(
    apiNodes: Array<{
      nodeType: string;
      taskId?: number | null;
      positionX?: number | null;
      positionY?: number | null;
      customName?: string | null;
      customNote?: string | null;
      externalTaskKey?: string | null;
    }>,
  ): Promise<void> {
    const requiredTaskKeys = apiNodes
      .filter((apiNode) => (apiNode.nodeType ?? '').toLowerCase() === 'task')
      .map((apiNode) => this.resolveTaskKey(apiNode))
      .filter((item): item is string => !!item);

    if (requiredTaskKeys.length === 0) {
      return;
    }

    const existingTaskKeys = new Set(
      this.tasks.map((task) => String(task.id ?? '').trim()).filter(Boolean),
    );
    const missingTaskKeys = Array.from(new Set(requiredTaskKeys)).filter(
      (taskKey) => !existingTaskKeys.has(taskKey),
    );

    if (missingTaskKeys.length === 0) {
      return;
    }

    try {
      const fetched = await firstValueFrom(
        this.historyService.getTasksByIds(missingTaskKeys),
      );
      const mergedTaskMap = new Map(
        this.tasks.map((task) => [String(task.id ?? '').trim(), task]),
      );
      for (const task of fetched ?? []) {
        const taskKey = String(task?.id ?? '').trim();
        if (!taskKey) {
          continue;
        }
        mergedTaskMap.set(taskKey, task as WorkflowTask);
      }
      this.tasks = Array.from(mergedTaskMap.values());
    } catch (ex: any) {
      this.toast.warning('โหลด task บางรายการของ workflow ไม่ครบ', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  private resolveTaskKey(apiNode: {
    taskId?: number | null;
    customName?: string | null;
    customNote?: string | null;
    externalTaskKey?: string | null;
  }): string | null {
    const externalTaskKey = String(
      apiNode.externalTaskKey ?? apiNode.customName ?? '',
    ).trim();
    if (externalTaskKey) {
      return externalTaskKey;
    }
    if (apiNode.taskId == null) {
      return null;
    }
    return String(apiNode.taskId).trim() || null;
  }

  private hydrateCanvasFromWorkflow(
    apiNodes: Array<{
      id: number;
      nodeType: string;
      taskId?: number | null;
      positionX?: number | null;
      positionY?: number | null;
      customName?: string | null;
      customNote?: string | null;
      externalTaskKey?: string | null;
    }>,
    apiEdges: Array<{ id: number; fromNodeId: number; toNodeId: number }>,
  ): void {
    const nodeIdMap = new Map<number, string>();
    const hydratedNodes: WFNode[] = [];

    for (const apiNode of apiNodes) {
      const isTask = (apiNode.nodeType ?? '').toLowerCase() === 'task';
      if (!isTask) {
        continue;
      }

      const taskKey = this.resolveTaskKey(apiNode);
      if (!taskKey) {
        continue;
      }

      const task = this.tasks.find((item) => {
        const numericMatched =
          apiNode.taskId != null &&
          this.parseTaskId(item.id) === apiNode.taskId;
        const externalMatched = String(item.id ?? '').trim() === taskKey;
        return numericMatched || externalMatched;
      });
      const fallbackTask: WorkflowTask = {
        id: taskKey,
        startDate: '',
        taskName: task?.taskName || `Task ${taskKey}`,
        projectName: task?.projectName || '-',
        status: task?.status || '-',
        duration: task?.duration ?? 0,
        description: task?.description,
        hyperlink: task?.hyperlink,
      };

      const index = hydratedNodes.length;
      const nodeId = `node-${apiNode.id}`;
      hydratedNodes.push({
        id: nodeId,
        backendNodeId: apiNode.id,
        x: apiNode.positionX ?? 80 + (index % 3) * 270,
        y: apiNode.positionY ?? 60 + Math.floor(index / 3) * 160,
        type: 'task',
        task: task ?? fallbackTask,
        label: task?.taskName || fallbackTask.taskName,
        note: '',
      });
      nodeIdMap.set(apiNode.id, nodeId);
    }

    for (const apiNode of apiNodes) {
      const isCustom = (apiNode.nodeType ?? '').toLowerCase() === 'custom';
      if (!isCustom) {
        continue;
      }

      const index = hydratedNodes.length;
      const nodeId = `custom-${apiNode.id}`;
      hydratedNodes.push({
        id: nodeId,
        backendNodeId: apiNode.id,
        x: apiNode.positionX ?? 100 + (index % 3) * 260,
        y: apiNode.positionY ?? 80 + Math.floor(index / 3) * 180,
        type: 'custom',
        label: apiNode.customName?.trim() || 'Custom Box',
        note: apiNode.customNote?.trim() || '',
      });
      nodeIdMap.set(apiNode.id, nodeId);
    }

    const hydratedConnections: WFConnection[] = apiEdges
      .map((edge) => {
        const fromNodeId = nodeIdMap.get(edge.fromNodeId);
        const toNodeId = nodeIdMap.get(edge.toNodeId);
        if (!fromNodeId || !toNodeId) {
          return null;
        }
        return {
          id: `conn-${edge.id}`,
          backendEdgeId: edge.id,
          fromNodeId,
          toNodeId,
        } as WFConnection;
      })
      .filter((item): item is WFConnection => item !== null);

    this.nodes = hydratedNodes;
    this.connections = hydratedConnections;
  }

  private centerLoadedWorkflow(): void {
    if (this.nodes.length === 0) {
      return;
    }

    const canvasEl = this.canvasWrapperEl?.nativeElement;
    if (!canvasEl) {
      return;
    }

    const rect = canvasEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const minX = Math.min(...this.nodes.map((node) => node.x));
    const minY = Math.min(...this.nodes.map((node) => node.y));
    const maxX = Math.max(
      ...this.nodes.map(
        (node) => node.x + (node.type === 'custom' ? CUSTOM_NODE_W : NODE_W),
      ),
    );
    const maxY = Math.max(...this.nodes.map((node) => node.y + NODE_H));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.panX = rect.width / 2 - centerX * this.zoom;
    this.panY = rect.height / 2 - centerY * this.zoom;
  }

  async saveWorkflow(): Promise<void> {
    if (!this.workflowId) {
      if (!this.selectedTask?.id) {
        this.toast.error('กรุณาเลือก task ก่อนบันทึก workflow');
        return;
      }

      try {
        const created = await firstValueFrom(
          this.workflowService.createWorkflow({
            name: `Workflow: ${this.selectedTask.taskName || this.selectedTask.id}`,
            description: `Created from task ${this.selectedTask.id}`,
          }),
        );
        this.workflowId = created.id;
        this.selectedWorkflowId = created.id;
        this.workflows = [...this.workflows, created].sort(
          (a, b) => a.id - b.id,
        );
      } catch (ex: any) {
        this.toast.error('สร้าง workflow ไม่สำเร็จ', {
          detail: ex?.error ?? ex?.message ?? String(ex),
        });
        return;
      }
    }

    const workflowId = this.workflowId;

    try {
      const syncNodes: Array<{
        clientNodeId: string;
        nodeType: 'Task' | 'Custom';
        taskId?: number | null;
        positionX: number;
        positionY: number;
        customName?: string | null;
        customNote?: string | null;
        externalTaskKey?: string | null;
      }> = [];

      let skippedInvalidTaskId = 0;
      let fallbackExternalTaskId = 0;

      for (const node of this.nodes) {
        if (node.type === 'custom') {
          const customName = String(node.label ?? '').trim() || node.id;
          const customNote = String(node.note ?? '').trim() || null;
          syncNodes.push({
            clientNodeId: node.id,
            nodeType: 'Custom',
            taskId: null,
            positionX: node.x,
            positionY: node.y,
            customName,
            customNote,
            externalTaskKey: null,
          });
          continue;
        }

        if (!node.task?.id) {
          continue;
        }

        const parsedTaskId = this.parseTaskId(node.task.id);
        if (parsedTaskId != null) {
          syncNodes.push({
            clientNodeId: node.id,
            nodeType: 'Task',
            taskId: parsedTaskId,
            positionX: node.x,
            positionY: node.y,
            customName: null,
          });
          continue;
        }

        const externalTaskId = String(node.task.id ?? '').trim();
        if (!externalTaskId) {
          skippedInvalidTaskId++;
          continue;
        }

        syncNodes.push({
          clientNodeId: node.id,
          nodeType: 'Task',
          taskId: null,
          positionX: node.x,
          positionY: node.y,
          customName: externalTaskId,
          externalTaskKey: externalTaskId,
        });
        fallbackExternalTaskId++;
      }

      const syncEdges = this.connections.map((connection) => ({
        fromClientNodeId: connection.fromNodeId,
        toClientNodeId: connection.toNodeId,
      }));

      const syncResult = await firstValueFrom(
        this.workflowService.syncGraph(workflowId, {
          nodes: syncNodes,
          edges: syncEdges,
          replaceExistingEdges: true,
        }),
      );

      this.toast.success(
        `บันทึก workflow สำเร็จ (เพิ่มโหนด ${syncResult.createdNodes}, เพิ่มเส้น ${syncResult.createdEdges}, ลบเส้น ${syncResult.deletedEdges})`,
      );

      if (
        skippedInvalidTaskId > 0 ||
        (syncResult.skippedEdges ?? 0) > 0 ||
        (syncResult.warnings?.length ?? 0) > 0
      ) {
        this.toast.warning('มีบางรายการที่ไม่ได้บันทึก', {
          detail: `task id ไม่ใช่ตัวเลขและไม่มีค่า fallback: ${skippedInvalidTaskId} รายการ, edge ถูกข้าม: ${syncResult.skippedEdges ?? 0} รายการ`,
        });
      }
    } catch (err: any) {
      this.toast.error('บันทึกเส้นเชื่อมไม่สำเร็จ', {
        detail: err?.error?.message ?? err?.message ?? 'Unknown error',
      });
    }
  }
}

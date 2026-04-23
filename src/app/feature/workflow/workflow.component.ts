import { CommonModule, DOCUMENT } from '@angular/common';
import { WorkflowService } from '../../shared/services/workflow.service';
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
const DEFAULT_WORKFLOW_ID = 1;
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

  private workflowId: number | null = null;

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
    await this.loadOrCreateWorkflow();
    this.focusTaskFromRoute();
  }

  get statusFilterOptions(): string[] {
    return ['all', ...this.statusOptions.map((o) => o.name)];
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
    this.selectTask(this.draggingTask);
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
    if (node.type === 'task' && node.task) {
      this.selectTask(node.task);
    }
  }

  openTaskDetailModal(event: MouseEvent, node: WFNode): void {
    event.stopPropagation();
    event.preventDefault();
    if (node.type !== 'task' || !node.task) {
      return;
    }
    this.selectTask(node.task);
    this.modalTask = node.task;
    this.isTaskDetailModalOpen = true;
  }

  closeTaskDetailModal(): void {
    this.isTaskDetailModalOpen = false;
    this.modalTask = null;
  }

  private focusTaskFromRoute(): void {
    const taskId = this.activatedRoute.snapshot.queryParamMap.get('taskId');
    if (!taskId) {
      return;
    }
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

  private async loadOrCreateWorkflow(): Promise<void> {
    try {
      const detail = await firstValueFrom(
        this.workflowService.getWorkflowDetail(DEFAULT_WORKFLOW_ID),
      );
      this.workflowId = detail.workflow?.id ?? DEFAULT_WORKFLOW_ID;
      this.hydrateCanvasFromWorkflow(detail.nodes ?? [], detail.edges ?? []);
    } catch (ex: any) {
      if (ex?.status === 404) {
        const created = await firstValueFrom(
          this.workflowService.createWorkflow({
            name: 'Main Workflow',
            description: 'Auto generated workflow',
          }),
        );
        this.workflowId = created.id;
        return;
      }
      this.toast.error('โหลด workflow ไม่สำเร็จ', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  private hydrateCanvasFromWorkflow(
    apiNodes: Array<{
      id: number;
      nodeType: string;
      taskId?: number | null;
      customName?: string | null;
    }>,
    apiEdges: Array<{ id: number; fromNodeId: number; toNodeId: number }>,
  ): void {
    const nodeIdMap = new Map<number, string>();
    const hydratedNodes: WFNode[] = [];

    for (const apiNode of apiNodes) {
      const isTask = (apiNode.nodeType ?? '').toLowerCase() === 'task';
      if (!isTask || apiNode.taskId == null) {
        continue;
      }

      const task = this.tasks.find(
        (item) => this.parseTaskId(item.id) === apiNode.taskId,
      );
      if (!task) {
        continue;
      }

      const index = hydratedNodes.length;
      const nodeId = `node-${task.id}`;
      hydratedNodes.push({
        id: nodeId,
        backendNodeId: apiNode.id,
        x: 80 + (index % 3) * 270,
        y: 60 + Math.floor(index / 3) * 160,
        type: 'task',
        task,
        label: task.taskName,
        note: '',
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

    if (hydratedNodes.length > 0) {
      this.nodes = hydratedNodes;
      this.connections = hydratedConnections;
    }
  }

  async saveWorkflow(): Promise<void> {
    if (!this.workflowId) {
      await this.loadOrCreateWorkflow();
    }

    if (!this.workflowId) {
      this.toast.error('ไม่พบ workflow สำหรับบันทึก');
      return;
    }

    const workflowId = this.workflowId;

    try {
      const syncNodes: Array<{
        clientNodeId: string;
        nodeType: 'Task' | 'Custom';
        taskId?: number | null;
        customName?: string | null;
      }> = [];

      let skippedInvalidTaskId = 0;

      for (const node of this.nodes) {
        if (node.type !== 'task' || !node.task?.id) {
          continue;
        }

        const parsedTaskId = this.parseTaskId(node.task.id);
        if (parsedTaskId == null) {
          skippedInvalidTaskId++;
          continue;
        }

        syncNodes.push({
          clientNodeId: node.id,
          nodeType: 'Task',
          taskId: parsedTaskId,
          customName: null,
        });
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
          detail: `task id ไม่ใช่ตัวเลข: ${skippedInvalidTaskId} รายการ, edge ถูกข้าม: ${syncResult.skippedEdges ?? 0} รายการ`,
        });
      }
    } catch (err: any) {
      this.toast.error('บันทึกเส้นเชื่อมไม่สำเร็จ', {
        detail: err?.error?.message ?? err?.message ?? 'Unknown error',
      });
    }
  }
}

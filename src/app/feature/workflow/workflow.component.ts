import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  HistoryService,
  HistoryQueryRequest,
} from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';

interface WorkflowTask {
  id: string;
  startDate: string;
  taskName: string;
  projectName: string;
  status: string;
  duration: number;
  description?: string;
}

interface WFNode {
  id: string;
  x: number;
  y: number;
  task: WorkflowTask;
}

interface WFConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

const NODE_W = 230;
const NODE_H = 95;

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
})
export class WorkflowComponent implements OnInit {
  private readonly historyService = inject(HistoryService);
  private readonly toast = inject(ToastService);

  tasks: WorkflowTask[] = [];
  nodes: WFNode[] = [];
  connections: WFConnection[] = [];

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
  isSpaceDown = false;

  readonly NODE_W = NODE_W;
  readonly NODE_H = NODE_H;

  @ViewChild('canvasWrapper') canvasWrapperEl!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
    await this.loadTasks();
  }

  async loadTasks() {
    try {
      const req: HistoryQueryRequest = {
        page: 1,
        pageSize: 200,
        isAllFilter: true,
      };
      const res = await firstValueFrom(this.historyService.getTask(req));
      this.tasks = Array.isArray(res) ? res : ((res as any).items ?? []);
    } catch (ex: any) {
      this.toast.error('ไม่สามารถโหลด task ได้', {
        detail: ex?.error ?? ex?.message ?? String(ex),
      });
    }
  }

  isOnCanvas(task: WorkflowTask): boolean {
    return this.nodes.some((n) => n.task.id === task.id);
  }

  addNodeFromTask(task: WorkflowTask) {
    if (this.isOnCanvas(task)) return;
    const i = this.nodes.length;
    this.nodes.push({
      id: `node-${task.id}`,
      x: 80 + (i % 3) * 270,
      y: 60 + Math.floor(i / 3) * 160,
      task,
    });
  }

  removeNode(nodeId: string, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    this.connections = this.connections.filter(
      (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
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
    if ((e.target as HTMLElement).closest('.port, .node-delete')) return;
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
    this.drawingConn = {
      fromNodeId: node.id,
      fromX: node.x + NODE_W,
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
        c.fromNodeId === this.drawingConn!.fromNodeId &&
        c.toNodeId === node.id
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

  // ── Canvas panning ─────────────────────────────────────
  onCanvasMouseDown(e: MouseEvent) {
    if (e.button === 1 || e.button === 2 || this.isSpaceDown) {
      e.preventDefault();
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !this.isSpaceDown) {
      this.isSpaceDown = true;
      e.preventDefault();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      this.isSpaceDown = false;
      this.isPanning = false;
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
    if (!this.isSpaceDown) this.isPanning = false;
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
  private screenToInner(clientX: number, clientY: number): { x: number; y: number } {
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
    if (this.isSpaceDown) return this.isPanning ? 'grabbing' : 'grab';
    if (this.isPanning) return 'grabbing';
    return 'default';
  }

  connPath(conn: WFConnection): string {
    const from = this.nodes.find((n) => n.id === conn.fromNodeId);
    const to = this.nodes.find((n) => n.id === conn.toNodeId);
    if (!from || !to) return '';
    return this.bezier(
      from.x + NODE_W,
      from.y + NODE_H / 2,
      to.x,
      to.y + NODE_H / 2
    );
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
    return {
      x: (from.x + NODE_W + to.x) / 2,
      y: (from.y + NODE_H / 2 + to.y + NODE_H / 2) / 2,
    };
  }
}

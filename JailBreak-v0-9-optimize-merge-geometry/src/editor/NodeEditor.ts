export interface NodePort {
  id: string;
  name: string;
  type: 'trigger' | 'value';
  connected: string[]; // IDs of connected ports
}

export interface ScriptNode {
  id: string;
  type: string;
  x: number;
  y: number;
  inputs: NodePort[];
  outputs: NodePort[];
  properties: Record<string, unknown>;
}

export interface NodeConnection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface ScriptGraph {
  nodes: ScriptNode[];
  connections: NodeConnection[];
}

interface NodeTypeDefinition {
  type: string;
  category: string;
  label: string;
  inputs: Array<{ name: string; type: 'trigger' | 'value' }>;
  outputs: Array<{ name: string; type: 'trigger' | 'value' }>;
  defaultProperties: Record<string, unknown>;
}

const NODE_TYPE_DEFINITIONS: NodeTypeDefinition[] = [
  { type: 'OnPlayerEnter', category: 'events', label: 'Игрок вошёл', inputs: [], outputs: [{ name: 'entered', type: 'trigger' }], defaultProperties: {} },
  { type: 'OnTimer', category: 'events', label: 'Таймер', inputs: [], outputs: [{ name: 'tick', type: 'trigger' }], defaultProperties: { interval: 1 } },
  { type: 'OnInteract', category: 'events', label: 'Взаимодействие', inputs: [], outputs: [{ name: 'interacted', type: 'trigger' }], defaultProperties: {} },
  { type: 'MoveTo', category: 'actions', label: 'Двигать к', inputs: [{ name: 'execute', type: 'trigger' }, { name: 'target', type: 'value' }], outputs: [], defaultProperties: { x: 0, y: 0, z: 0, duration: 1 } },
  { type: 'PlaySound', category: 'actions', label: 'Звук', inputs: [{ name: 'execute', type: 'trigger' }], outputs: [], defaultProperties: { sound: '' } },
  { type: 'ToggleDoor', category: 'actions', label: 'Дверь', inputs: [{ name: 'execute', type: 'trigger' }], outputs: [], defaultProperties: { doorId: '' } },
  { type: 'SpawnItem', category: 'actions', label: 'Спавн предмета', inputs: [{ name: 'execute', type: 'trigger' }], outputs: [], defaultProperties: { itemType: '', x: 0, y: 0, z: 0 } },
  { type: 'SetVariable', category: 'actions', label: 'Переменная', inputs: [{ name: 'execute', type: 'trigger' }, { name: 'value', type: 'value' }], outputs: [], defaultProperties: { name: '' } },
  { type: 'CompareValue', category: 'logic', label: 'Сравнить', inputs: [{ name: 'a', type: 'value' }, { name: 'b', type: 'value' }], outputs: [{ name: 'equal', type: 'trigger' }, { name: 'notEqual', type: 'trigger' }], defaultProperties: {} },
  { type: 'LogicAnd', category: 'logic', label: 'И', inputs: [{ name: 'a', type: 'trigger' }, { name: 'b', type: 'trigger' }], outputs: [{ name: 'result', type: 'trigger' }], defaultProperties: {} },
  { type: 'LogicOr', category: 'logic', label: 'ИЛИ', inputs: [{ name: 'a', type: 'trigger' }, { name: 'b', type: 'trigger' }], outputs: [{ name: 'result', type: 'trigger' }], defaultProperties: {} },
  { type: 'Delay', category: 'logic', label: 'Задержка', inputs: [{ name: 'execute', type: 'trigger' }], outputs: [{ name: 'done', type: 'trigger' }], defaultProperties: { seconds: 1 } },
];

const NODE_WIDTH = 160;
const NODE_HEADER_HEIGHT = 28;
const PORT_RADIUS = 7;
const PORT_SPACING = 24;

function getCategoryColor(category: string): string {
  switch (category) {
    case 'events': return '#22c55e';
    case 'actions': return '#3b82f6';
    case 'logic': return '#a855f7';
    default: return '#6b7280';
  }
}

export class NodeEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private graph: ScriptGraph = { nodes: [], connections: [] };
  private selectedNode: string | null = null;
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private panning = false;
  private panOffset = { x: 0, y: 0 };
  private panStart = { x: 0, y: 0 };
  private zoom = 1;
  private connectingFrom: { nodeId: string; portId: string; isOutput: boolean } | null = null;
  private mousePos = { x: 0, y: 0 };

  public onGraphChanged?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.render();
  }

  addNode(type: string, x: number, y: number): ScriptNode {
    const def = NODE_TYPE_DEFINITIONS.find(d => d.type === type);
    if (!def) {
      const node: ScriptNode = { id: this.genId(), type, x, y, inputs: [], outputs: [], properties: {} };
      this.graph.nodes.push(node);
      this.render();
      return node;
    }
    const node: ScriptNode = {
      id: this.genId(),
      type,
      x, y,
      inputs: def.inputs.map(p => ({ id: this.genId(), name: p.name, type: p.type, connected: [] })),
      outputs: def.outputs.map(p => ({ id: this.genId(), name: p.name, type: p.type, connected: [] })),
      properties: { ...def.defaultProperties },
    };
    this.graph.nodes.push(node);
    this.onGraphChanged?.();
    this.render();
    return node;
  }

  removeNode(nodeId: string): void {
    // Remove connections to/from this node
    this.graph.connections = this.graph.connections.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId);
    // Clean connected arrays
    for (const node of this.graph.nodes) {
      for (const port of [...node.inputs, ...node.outputs]) {
        port.connected = port.connected.filter(cId => {
          const conn = this.graph.connections.find(c => c.id === cId);
          return conn !== undefined;
        });
      }
    }
    this.graph.nodes = this.graph.nodes.filter(n => n.id !== nodeId);
    if (this.selectedNode === nodeId) this.selectedNode = null;
    this.onGraphChanged?.();
    this.render();
  }

  connect(fromNode: string, fromPort: string, toNode: string, toPort: string): NodeConnection | null {
    // Prevent self-connection
    if (fromNode === toNode) return null;
    // Check duplicate
    const dup = this.graph.connections.find(c => c.fromNode === fromNode && c.fromPort === fromPort && c.toNode === toNode && c.toPort === toPort);
    if (dup) return null;

    const conn: NodeConnection = { id: this.genId(), fromNode, fromPort, toNode, toPort };
    this.graph.connections.push(conn);

    // Update port connected arrays
    const srcNode = this.graph.nodes.find(n => n.id === fromNode);
    const dstNode = this.graph.nodes.find(n => n.id === toNode);
    if (srcNode) {
      const port = srcNode.outputs.find(p => p.id === fromPort);
      if (port) port.connected.push(conn.id);
    }
    if (dstNode) {
      const port = dstNode.inputs.find(p => p.id === toPort);
      if (port) port.connected.push(conn.id);
    }

    this.onGraphChanged?.();
    this.render();
    return conn;
  }

  disconnect(connectionId: string): void {
    const conn = this.graph.connections.find(c => c.id === connectionId);
    if (!conn) return;
    this.graph.connections = this.graph.connections.filter(c => c.id !== connectionId);
    // Clean connected arrays
    for (const node of this.graph.nodes) {
      for (const port of [...node.inputs, ...node.outputs]) {
        port.connected = port.connected.filter(id => id !== connectionId);
      }
    }
    this.onGraphChanged?.();
    this.render();
  }

  getGraph(): ScriptGraph {
    return this.graph;
  }

  setGraph(graph: ScriptGraph): void {
    this.graph = graph;
    this.selectedNode = null;
    this.render();
  }

  getNodeTypes(): Array<{ type: string; category: string; label: string }> {
    return NODE_TYPE_DEFINITIONS.map(d => ({ type: d.type, category: d.category, label: d.label }));
  }

  dispose(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.save();
    ctx.translate(this.panOffset.x, this.panOffset.y);
    ctx.scale(this.zoom, this.zoom);

    const gridSize = 40;
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const startX = Math.floor(-this.panOffset.x / this.zoom / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-this.panOffset.y / this.zoom / gridSize) * gridSize - gridSize;
    const endX = startX + w / this.zoom + gridSize * 2;
    const endY = startY + h / this.zoom + gridSize * 2;
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }

    // Draw connections
    for (const conn of this.graph.connections) {
      this.drawConnection(ctx, conn);
    }

    // Draw in-progress connection
    if (this.connectingFrom) {
      const srcNode = this.graph.nodes.find(n => n.id === this.connectingFrom!.nodeId);
      if (srcNode) {
        const portPos = this.getPortPosition(srcNode, this.connectingFrom.portId, this.connectingFrom.isOutput);
        const mx = (this.mousePos.x - this.panOffset.x) / this.zoom;
        const my = (this.mousePos.y - this.panOffset.y) / this.zoom;
        this.drawBezier(ctx, portPos.x, portPos.y, mx, my, '#ffffff');
      }
    }

    // Draw nodes
    for (const node of this.graph.nodes) {
      this.drawNode(ctx, node);
    }

    ctx.restore();
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: ScriptNode): void {
    const def = NODE_TYPE_DEFINITIONS.find(d => d.type === node.type);
    const category = def?.category || 'actions';
    const label = def?.label || node.type;
    const color = getCategoryColor(category);

    const portCount = Math.max(node.inputs.length, node.outputs.length);
    const nodeHeight = NODE_HEADER_HEIGHT + Math.max(portCount * PORT_SPACING + 8, 32);

    const isSelected = this.selectedNode === node.id;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(node.x + 3, node.y + 3, NODE_WIDTH, nodeHeight, 8);
    ctx.fill();

    // Body
    ctx.fillStyle = isSelected ? '#2a2a4e' : '#1e1e3a';
    ctx.strokeStyle = isSelected ? '#60a5fa' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, nodeHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Header
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [8, 8, 0, 0]);
    ctx.fill();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, node.x + NODE_WIDTH / 2, node.y + 18);

    // Ports - inputs (left side)
    for (let i = 0; i < node.inputs.length; i++) {
      const port = node.inputs[i];
      const py = node.y + NODE_HEADER_HEIGHT + 16 + i * PORT_SPACING;
      ctx.fillStyle = port.type === 'trigger' ? '#f59e0b' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(node.x, py, PORT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cccccc';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(port.name, node.x + PORT_RADIUS + 4, py + 4);
    }

    // Ports - outputs (right side)
    for (let i = 0; i < node.outputs.length; i++) {
      const port = node.outputs[i];
      const py = node.y + NODE_HEADER_HEIGHT + 16 + i * PORT_SPACING;
      ctx.fillStyle = port.type === 'trigger' ? '#f59e0b' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(node.x + NODE_WIDTH, py, PORT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cccccc';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(port.name, node.x + NODE_WIDTH - PORT_RADIUS - 4, py + 4);
    }
  }

  private drawConnection(ctx: CanvasRenderingContext2D, conn: NodeConnection): void {
    const fromNode = this.graph.nodes.find(n => n.id === conn.fromNode);
    const toNode = this.graph.nodes.find(n => n.id === conn.toNode);
    if (!fromNode || !toNode) return;

    const fromPos = this.getPortPosition(fromNode, conn.fromPort, true);
    const toPos = this.getPortPosition(toNode, conn.toPort, false);

    this.drawBezier(ctx, fromPos.x, fromPos.y, toPos.x, toPos.y, '#f59e0b');
  }

  private drawBezier(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string): void {
    const dx = Math.abs(x2 - x1) * 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
    ctx.stroke();
  }

  private getPortPosition(node: ScriptNode, portId: string, isOutput: boolean): { x: number; y: number } {
    const ports = isOutput ? node.outputs : node.inputs;
    const idx = ports.findIndex(p => p.id === portId);
    if (idx === -1) return { x: node.x, y: node.y };
    const py = node.y + NODE_HEADER_HEIGHT + 16 + idx * PORT_SPACING;
    return { x: isOutput ? node.x + NODE_WIDTH : node.x, y: py };
  }

  private setupEventListeners(): void {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private handleContextMenu(e: Event): void {
    e.preventDefault();
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.mousePos = { x: mx, y: my };

    // Middle mouse or right mouse = panning
    if (e.button === 1 || e.button === 2) {
      this.panning = true;
      this.panStart = { x: mx - this.panOffset.x, y: my - this.panOffset.y };
      return;
    }

    // Transform mouse to world space
    const wx = (mx - this.panOffset.x) / this.zoom;
    const wy = (my - this.panOffset.y) / this.zoom;

    // Check port click first
    for (const node of this.graph.nodes) {
      // Check output ports
      for (const port of node.outputs) {
        const pos = this.getPortPosition(node, port.id, true);
        if (Math.hypot(wx - pos.x, wy - pos.y) < PORT_RADIUS + 3) {
          this.connectingFrom = { nodeId: node.id, portId: port.id, isOutput: true };
          return;
        }
      }
      // Check input ports
      for (const port of node.inputs) {
        const pos = this.getPortPosition(node, port.id, false);
        if (Math.hypot(wx - pos.x, wy - pos.y) < PORT_RADIUS + 3) {
          this.connectingFrom = { nodeId: node.id, portId: port.id, isOutput: false };
          return;
        }
      }
    }

    // Check node click (reverse order = top nodes first)
    for (let i = this.graph.nodes.length - 1; i >= 0; i--) {
      const node = this.graph.nodes[i];
      const def = NODE_TYPE_DEFINITIONS.find(d => d.type === node.type);
      const portCount = Math.max(node.inputs.length, node.outputs.length);
      const nodeHeight = NODE_HEADER_HEIGHT + Math.max(portCount * PORT_SPACING + 8, 32);
      const category = def?.category || 'actions';
      void category;

      if (wx >= node.x && wx <= node.x + NODE_WIDTH && wy >= node.y && wy <= node.y + nodeHeight) {
        this.selectedNode = node.id;
        this.dragging = true;
        this.dragOffset = { x: wx - node.x, y: wy - node.y };
        // Move to end (top render)
        this.graph.nodes.splice(i, 1);
        this.graph.nodes.push(node);
        this.render();
        return;
      }
    }

    // Click on empty space
    this.selectedNode = null;
    this.panning = true;
    this.panStart = { x: mx - this.panOffset.x, y: my - this.panOffset.y };
    this.render();
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.mousePos = { x: mx, y: my };

    if (this.panning) {
      this.panOffset = { x: mx - this.panStart.x, y: my - this.panStart.y };
      this.render();
      return;
    }

    if (this.dragging && this.selectedNode) {
      const wx = (mx - this.panOffset.x) / this.zoom;
      const wy = (my - this.panOffset.y) / this.zoom;
      const node = this.graph.nodes.find(n => n.id === this.selectedNode);
      if (node) {
        node.x = wx - this.dragOffset.x;
        node.y = wy - this.dragOffset.y;
        this.render();
      }
      return;
    }

    if (this.connectingFrom) {
      this.render();
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.connectingFrom) {
      const wx = (mx - this.panOffset.x) / this.zoom;
      const wy = (my - this.panOffset.y) / this.zoom;

      // Find target port
      for (const node of this.graph.nodes) {
        if (this.connectingFrom.isOutput) {
          // Connecting from output, look for input ports
          for (const port of node.inputs) {
            const pos = this.getPortPosition(node, port.id, false);
            if (Math.hypot(wx - pos.x, wy - pos.y) < PORT_RADIUS + 5) {
              this.connect(this.connectingFrom.nodeId, this.connectingFrom.portId, node.id, port.id);
              break;
            }
          }
        } else {
          // Connecting from input, look for output ports
          for (const port of node.outputs) {
            const pos = this.getPortPosition(node, port.id, true);
            if (Math.hypot(wx - pos.x, wy - pos.y) < PORT_RADIUS + 5) {
              this.connect(node.id, port.id, this.connectingFrom.nodeId, this.connectingFrom.portId);
              break;
            }
          }
        }
      }
      this.connectingFrom = null;
      this.render();
    }

    if (this.dragging) {
      this.dragging = false;
      this.onGraphChanged?.();
    }
    this.panning = false;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.3, Math.min(3, this.zoom * factor));
    this.render();
  }

  getSelectedNode(): string | null {
    return this.selectedNode;
  }

  private genId(): string {
    return `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
}

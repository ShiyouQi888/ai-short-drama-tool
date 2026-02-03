"use client";

import { create } from "zustand";
import type {
  CanvasState,
  Connection,
  NodeType,
  PipelineNode,
  Position,
  Project,
  HistoryEntry,
} from "./pipeline-types";
import { createConnectionId, createNode } from "./pipeline-types";

interface PipelineStore extends CanvasState {
  // 项目管理
  currentProject: Project | null;
  projects: Project[];
  history: HistoryEntry[];
  historyIndex: number;
  autoSaveEnabled: boolean;
  lastSaved: number | null;
  isDirty: boolean;
  
  // 节点操作
  addNode: (type: NodeType, position: Position) => void;
  removeNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: Position) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setNodeStatus: (nodeId: string, status: PipelineNode["status"]) => void;
  toggleNodeAsync: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;

  // 连接操作
  startConnection: (nodeId: string, portId: string, portType: "input" | "output") => void;
  completeConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
  removeConnection: (connectionId: string) => void;

  // 画布操作
  setScale: (scale: number) => void;
  setOffset: (offset: Position) => void;
  pan: (delta: Position) => void;

  // 项目操作
  createProject: (name: string) => void;
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  renameProject: (name: string) => void;
  
  // 历史记录
  pushHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // 流水线操作
  runPipeline: () => Promise<void>;
  clearCanvas: () => void;
}

const MAX_HISTORY = 50;

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  nodes: [],
  connections: [],
  scale: 1,
  offset: { x: 100, y: 100 },
  selectedNodeId: null,
  connectingFrom: null,
  currentProject: null,
  projects: [],
  history: [],
  historyIndex: -1,

  addNode: (type, position) => {
    const node = createNode(type, position);
    set((state) => ({
      nodes: [...state.nodes, node],
      selectedNodeId: node.id,
    }));
    get().pushHistory(`添加节点: ${node.title}`);
  },

  removeNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      connections: state.connections.filter(
        (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
    if (node) {
      get().pushHistory(`删除节点: ${node.title}`);
    }
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position } : n
      ),
    }));
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  setNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, status } : n
      ),
    }));
  },

  toggleNodeAsync: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, isAsync: !n.isAsync } : n
      ),
    }));
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  startConnection: (nodeId, portId, portType) => {
    set({ connectingFrom: { nodeId, portId, portType } });
  },

  completeConnection: (targetNodeId, targetPortId) => {
    const { connectingFrom, nodes, connections } = get();
    if (!connectingFrom) return;

    const sourceNode = nodes.find((n) => n.id === connectingFrom.nodeId);
    const targetNode = nodes.find((n) => n.id === targetNodeId);
    if (!sourceNode || !targetNode) return;

    let sourceNodeId: string;
    let sourcePortId: string;
    let finalTargetNodeId: string;
    let finalTargetPortId: string;

    if (connectingFrom.portType === "output") {
      sourceNodeId = connectingFrom.nodeId;
      sourcePortId = connectingFrom.portId;
      finalTargetNodeId = targetNodeId;
      finalTargetPortId = targetPortId;
    } else {
      sourceNodeId = targetNodeId;
      sourcePortId = targetPortId;
      finalTargetNodeId = connectingFrom.nodeId;
      finalTargetPortId = connectingFrom.portId;
    }

    const exists = connections.some(
      (c) =>
        c.sourceNodeId === sourceNodeId &&
        c.sourcePortId === sourcePortId &&
        c.targetNodeId === finalTargetNodeId &&
        c.targetPortId === finalTargetPortId
    );

    if (!exists && sourceNodeId !== finalTargetNodeId) {
      const connection: Connection = {
        id: createConnectionId(sourceNodeId, sourcePortId, finalTargetNodeId, finalTargetPortId),
        sourceNodeId,
        sourcePortId,
        targetNodeId: finalTargetNodeId,
        targetPortId: finalTargetPortId,
      };

      const updatedNodes = nodes.map((node) => {
        if (node.id === sourceNodeId) {
          return {
            ...node,
            outputs: node.outputs.map((p) =>
              p.id === sourcePortId ? { ...p, connected: true } : p
            ),
          };
        }
        if (node.id === finalTargetNodeId) {
          return {
            ...node,
            inputs: node.inputs.map((p) =>
              p.id === finalTargetPortId ? { ...p, connected: true } : p
            ),
          };
        }
        return node;
      });

      set({
        connections: [...connections, connection],
        nodes: updatedNodes,
        connectingFrom: null,
      });
      get().pushHistory("添加连接");
    } else {
      set({ connectingFrom: null });
    }
  },

  cancelConnection: () => {
    set({ connectingFrom: null });
  },

  removeConnection: (connectionId) => {
    const { connections, nodes } = get();
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) return;

    const updatedNodes = nodes.map((node) => {
      if (node.id === connection.sourceNodeId) {
        return {
          ...node,
          outputs: node.outputs.map((p) =>
            p.id === connection.sourcePortId ? { ...p, connected: false } : p
          ),
        };
      }
      if (node.id === connection.targetNodeId) {
        return {
          ...node,
          inputs: node.inputs.map((p) =>
            p.id === connection.targetPortId ? { ...p, connected: false } : p
          ),
        };
      }
      return node;
    });

    set({
      connections: connections.filter((c) => c.id !== connectionId),
      nodes: updatedNodes,
    });
    get().pushHistory("删除连接");
  },

  setScale: (scale) => {
    set({ scale: Math.max(0.25, Math.min(2, scale)) });
  },

  setOffset: (offset) => {
    set({ offset });
  },

  pan: (delta) => {
    set((state) => ({
      offset: {
        x: state.offset.x + delta.x,
        y: state.offset.y + delta.y,
      },
    }));
  },

  createProject: (name) => {
    const project: Project = {
      id: `project-${Date.now()}`,
      name,
      nodes: [],
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      projects: [...state.projects, project],
      currentProject: project,
      nodes: [],
      connections: [],
      selectedNodeId: null,
      history: [],
      historyIndex: -1,
    }));
  },

  saveProject: () => {
    const { currentProject, nodes, connections, projects } = get();
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      nodes,
      connections,
      updatedAt: Date.now(),
    };

    set({
      currentProject: updatedProject,
      projects: projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      ),
    });
  },

  loadProject: (projectId) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    set({
      currentProject: project,
      nodes: project.nodes,
      connections: project.connections,
      selectedNodeId: null,
      history: [],
      historyIndex: -1,
    });
  },

  deleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
    }));
  },

  renameProject: (name) => {
    const { currentProject, projects } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject, name, updatedAt: Date.now() };
    set({
      currentProject: updatedProject,
      projects: projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      ),
    });
  },

  pushHistory: (action) => {
    const { nodes, connections, history, historyIndex } = get();
    const entry: HistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: Date.now(),
      action,
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
    };

    // 如果在历史中间进行了新操作，删除后面的历史
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);

    // 限制历史记录数量
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const prevEntry = history[historyIndex - 1];
    set({
      nodes: JSON.parse(JSON.stringify(prevEntry.nodes)),
      connections: JSON.parse(JSON.stringify(prevEntry.connections)),
      historyIndex: historyIndex - 1,
      selectedNodeId: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const nextEntry = history[historyIndex + 1];
    set({
      nodes: JSON.parse(JSON.stringify(nextEntry.nodes)),
      connections: JSON.parse(JSON.stringify(nextEntry.connections)),
      historyIndex: historyIndex + 1,
      selectedNodeId: null,
    });
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  runPipeline: async () => {
    const { nodes, connections, setNodeStatus } = get();

    const startingNodes = nodes.filter(
      (node) => !connections.some((c) => c.targetNodeId === node.id)
    );

    const runNode = async (node: PipelineNode) => {
      setNodeStatus(node.id, "running");
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );
      setNodeStatus(node.id, "completed");

      const connectedNodeIds = connections
        .filter((c) => c.sourceNodeId === node.id)
        .map((c) => c.targetNodeId);

      const connectedNodes = nodes.filter((n) =>
        connectedNodeIds.includes(n.id)
      );

      if (node.isAsync) {
        await Promise.all(connectedNodes.map(runNode));
      } else {
        for (const connectedNode of connectedNodes) {
          await runNode(connectedNode);
        }
      }
    };

    await Promise.all(startingNodes.map(runNode));
  },

  clearCanvas: () => {
    get().pushHistory("清空画布");
    set({
      nodes: [],
      connections: [],
      selectedNodeId: null,
      connectingFrom: null,
    });
  },
}));

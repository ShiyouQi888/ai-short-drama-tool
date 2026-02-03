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
import { AIService } from "./ai-service";
import {
  createNode,
  createConnectionId,
  NODE_CONFIGS,
} from "./pipeline-types";

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
  updateNodePorts: (nodeId: string, inputs?: PipelineNode["inputs"], outputs?: PipelineNode["outputs"]) => void;
  setNodeStatus: (nodeId: string, status: PipelineNode["status"]) => void;
  toggleNodeAsync: (nodeId: string) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;

  // 连接操作
  startConnection: (nodeId: string, portId: string, portType: "input" | "output") => void;
  completeConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
  removeConnection: (connectionId: string) => void;

  // 画布操作
  setScale: (scale: number) => void;
  setOffset: (offset: Position) => void;
  setLineStyle: (style: CanvasState["lineStyle"]) => void;
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

  // 自动生成角色节点
  generateCharactersFlow: (scriptNodeId: string, providedData?: any) => Promise<void>;
  // 自动生成剧集流程
  generateEpisodesFlow: (scriptNodeId: string, providedData?: any) => Promise<void>;
  // 自动生成分镜场景节点
  generateScenesFlow: (storyboardNodeId: string, providedData?: any) => Promise<void>;
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
  lineStyle: "bezier",
  selectedNodeId: null,
  connectingFrom: null,
  currentProject: null,
  projects: [],
  history: [],
  historyIndex: -1,

  generateCharactersFlow: async (scriptNodeId: string, providedData?: any) => {
    const { nodes, connections, pushHistory } = get();
    const scriptNode = nodes.find(n => n.id === scriptNodeId);
    if (!scriptNode || scriptNode.type !== "script") return;

    // 优先使用传入的数据，否则从节点数据中获取
    const characters = providedData?.characters || (scriptNode.data.characters as any[]) || [];
    if (characters.length === 0) {
      console.warn(`[generateCharactersFlow] No characters found for node ${scriptNodeId}`);
      return;
    }

    const basePos = scriptNode.position;
    const newNodes: PipelineNode[] = [];
    const newConnections: Connection[] = [];
    const scriptOutputId = scriptNode.outputs[0]?.id || `${scriptNode.id}-output-0`;

    characters.forEach((char: any, i: number) => {
      // 角色节点排列在剧本节点上方，横向展开
      const xOffset = (i - (characters.length - 1) / 2) * 350;
      const charNodeId = `node-${Date.now()}-${i}-char`;
      const charNode: PipelineNode = createNode("character", { x: basePos.x + xOffset, y: basePos.y - 500 });
      charNode.id = charNodeId;
      charNode.data = {
        ...charNode.data,
        name: char.name,
        identity: char.identity,
        description: char.description,
        appearance: char.appearance,
        personality_tags: char.personality_tags,
        motivation: char.motivation,
        prompt: `Portrait of ${char.name}, ${char.identity}, ${char.appearance}, ${char.description}, highly detailed, cinematic lighting, 8k, professional photography`,
      };

      newNodes.push(charNode);

      // 建立连接：剧本 -> 角色
      const conn: Connection = {
        id: createConnectionId(scriptNode.id, scriptOutputId, charNode.id, charNode.inputs[0].id),
        sourceNodeId: scriptNode.id,
        sourcePortId: scriptOutputId,
        targetNodeId: charNode.id,
        targetPortId: charNode.inputs[0].id,
      };
      newConnections.push(conn);
      
      charNode.inputs[0].connected = true;
    });

    if (scriptNode.outputs[0]) {
      scriptNode.outputs[0].connected = true;
    }

    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
      connections: [...state.connections, ...newConnections],
    }));

    pushHistory(`自动生成 ${characters.length} 个角色节点`);
  },

  generateEpisodesFlow: async (scriptNodeId: string, providedData?: any) => {
    const { nodes, connections, pushHistory } = get();
    const scriptNode = nodes.find(n => n.id === scriptNodeId);
    if (!scriptNode || scriptNode.type !== "script") return;

    // 优先使用传入的数据
    const episodes = providedData?.episodeScripts || (scriptNode.data.episodeScripts as any[]) || [];
    if (episodes.length === 0) {
      console.warn(`[generateEpisodesFlow] No episodes found for node ${scriptNodeId}`);
      return;
    }

    const basePos = scriptNode.position;
    const newNodes: PipelineNode[] = [];
    const newConnections: Connection[] = [];
    
    // 获取脚本节点的输出端口ID
    const scriptOutputId = scriptNode.outputs[0]?.id || `${scriptNode.id}-output-0`;

    episodes.forEach((ep: any, i: number) => {
      const yOffset = (i - (episodes.length - 1) / 2) * 600;
      
      // 1. 创建剧集节点
      const epNodeId = `node-${Date.now()}-${i}-ep`;
      const epNode: PipelineNode = createNode("episode", { x: basePos.x + 500, y: basePos.y + yOffset });
      epNode.id = epNodeId;
      epNode.data = {
        ...epNode.data,
        episodeNumber: ep.id,
        title: ep.title,
        content: ep.content,
      };
      
      // 2. 创建分镜节点
      const sbNodeId = `node-${Date.now()}-${i}-sb`;
      const sbNode: PipelineNode = createNode("storyboard", { x: basePos.x + 950, y: basePos.y + yOffset });
      sbNode.id = sbNodeId;
      
      // 3. 创建图像生成节点
      const imgNodeId = `node-${Date.now()}-${i}-img`;
      const imgNode: PipelineNode = createNode("image", { x: basePos.x + 1800, y: basePos.y + yOffset - 150 });
      imgNode.id = imgNodeId;

      // 4. 创建音频配音节点
      const audioNodeId = `node-${Date.now()}-${i}-au`;
      const audioNode: PipelineNode = createNode("audio", { x: basePos.x + 1800, y: basePos.y + yOffset + 150 });
      audioNode.id = audioNodeId;

      // 5. 创建视频生成节点
      const videoNodeId = `node-${Date.now()}-${i}-vid`;
      const videoNode: PipelineNode = createNode("video", { x: basePos.x + 2200, y: basePos.y + yOffset });
      videoNode.id = videoNodeId;

      newNodes.push(epNode, sbNode, imgNode, audioNode, videoNode);

      // 建立连接
      newConnections.push({
        id: createConnectionId(scriptNode.id, scriptOutputId, epNode.id, epNode.inputs[0].id),
        sourceNodeId: scriptNode.id,
        sourcePortId: scriptOutputId,
        targetNodeId: epNode.id,
        targetPortId: epNode.inputs[0].id,
      });
      
      newConnections.push({
        id: createConnectionId(epNode.id, epNode.outputs[0].id, sbNode.id, sbNode.inputs[0].id),
        sourceNodeId: epNode.id,
        sourcePortId: epNode.outputs[0].id,
        targetNodeId: sbNode.id,
        targetPortId: sbNode.inputs[0].id,
      });

      newConnections.push({
        id: createConnectionId(sbNode.id, sbNode.outputs[0].id, imgNode.id, imgNode.inputs[0].id),
        sourceNodeId: sbNode.id,
        sourcePortId: sbNode.outputs[0].id,
        targetNodeId: imgNode.id,
        targetPortId: imgNode.inputs[0].id,
      });

      newConnections.push({
        id: createConnectionId(epNode.id, epNode.outputs[0].id, audioNode.id, audioNode.inputs[0].id),
        sourceNodeId: epNode.id,
        sourcePortId: epNode.outputs[0].id,
        targetNodeId: audioNode.id,
        targetPortId: audioNode.inputs[0].id,
      });

      newConnections.push({
        id: createConnectionId(imgNode.id, imgNode.outputs[0].id, videoNode.id, videoNode.inputs[0].id),
        sourceNodeId: imgNode.id,
        sourcePortId: imgNode.outputs[0].id,
        targetNodeId: videoNode.id,
        targetPortId: videoNode.inputs[0].id,
      });

      newConnections.push({
        id: createConnectionId(audioNode.id, audioNode.outputs[0].id, videoNode.id, videoNode.inputs[1].id),
        sourceNodeId: audioNode.id,
        sourcePortId: audioNode.outputs[0].id,
        targetNodeId: videoNode.id,
        targetPortId: videoNode.inputs[1].id,
      });
      
      epNode.inputs[0].connected = true;
      epNode.outputs[0].connected = true;
      sbNode.inputs[0].connected = true;
      sbNode.outputs[0].connected = true;
      imgNode.inputs[0].connected = true;
      imgNode.outputs[0].connected = true;
      audioNode.inputs[0].connected = true;
      audioNode.outputs[0].connected = true;
      videoNode.inputs[0].connected = true;
      videoNode.inputs[1].connected = true;
    });

    if (scriptNode.outputs[0]) {
      scriptNode.outputs[0].connected = true;
    }

    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
      connections: [...state.connections, ...newConnections],
    }));
    
    pushHistory(`自动生成 ${episodes.length} 集完整流程`);
  },

  generateScenesFlow: async (storyboardNodeId: string, providedData?: any) => {
    const { nodes, connections, pushHistory } = get();
    const sbNode = nodes.find(n => n.id === storyboardNodeId);
    if (!sbNode || sbNode.type !== "storyboard") return;

    const scenes = providedData?.scenes || (sbNode.data.scenes as any[]) || [];
    if (scenes.length === 0) {
      console.warn(`[generateScenesFlow] No scenes found for node ${storyboardNodeId}`);
      return;
    }

    const basePos = sbNode.position;
    const newNodes: PipelineNode[] = [];
    const newConnections: Connection[] = [];
    
    const sbOutputId = sbNode.outputs[0]?.id || `${sbNode.id}-output-0`;

    scenes.forEach((scene: any, i: number) => {
      const yOffset = (i - (scenes.length - 1) / 2) * 200;
      const sceneNodeId = `node-${Date.now()}-${i}-scene`;
      
      const sceneNode: PipelineNode = createNode("image", { x: basePos.x + 400, y: basePos.y + yOffset });
      sceneNode.id = sceneNodeId;
      sceneNode.title = `镜头 ${scene.id || i + 1}`;
      sceneNode.data = {
        ...sceneNode.data,
        prompt: scene.content,
        duration: scene.duration,
        sceneIndex: i,
      };

      newNodes.push(sceneNode);

      newConnections.push({
        id: createConnectionId(sbNode.id, sbOutputId, sceneNode.id, sceneNode.inputs[0].id),
        sourceNodeId: sbNode.id,
        sourcePortId: sbOutputId,
        targetNodeId: sceneNode.id,
        targetPortId: sceneNode.inputs[0].id,
      });
      
      sceneNode.inputs[0].connected = true;
    });

    if (sbNode.outputs[0]) {
      sbNode.outputs[0].connected = true;
    }

    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
      connections: [...state.connections, ...newConnections],
    }));

    pushHistory(`自动生成 ${scenes.length} 个镜头节点`);
  },

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

  updateNodeData: (nodeId: string, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  updateNodePorts: (nodeId, inputs, outputs) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const newNode = { ...n };
        if (inputs) newNode.inputs = inputs;
        if (outputs) newNode.outputs = outputs;
        return newNode;
      }),
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

  toggleNodeCollapsed: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, isCollapsed: !n.isCollapsed } : n
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

  setLineStyle: (lineStyle) => {
    set({ lineStyle });
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
    const { setNodeStatus, updateNodeData } = get();

    // 状态重置
    get().nodes.forEach(node => setNodeStatus(node.id, "idle"));

    const runNode = async (node: PipelineNode) => {
      const { nodes, connections } = get();
      // 检查前置节点是否已完成
      const predecessorConnections = connections.filter(c => c.targetNodeId === node.id);
      const allPredecessorsFinished = predecessorConnections.every(c => {
        const sourceNode = nodes.find(n => n.id === c.sourceNodeId);
        return sourceNode?.status === "completed";
      });

      if (predecessorConnections.length > 0 && !allPredecessorsFinished) {
        return;
      }

      setNodeStatus(node.id, "running");
      
      try {
        const outputs: Record<string, unknown> = {};
        
        switch (node.type) {
          case "text-input":
            outputs.text = node.data.text || "输入的文本内容";
            break;

          case "script": {
            const prompt = node.data.prompt as string;
            const episodesCount = (node.data.episodes as number) || 6;
            const systemPrompt = `你是一个专业的短剧编剧。请根据用户提供的故事提示词，创作一个精彩的短剧剧本。
你的输出必须是一个严格的 JSON 格式，包含以下字段：
1. title: 剧名
2. background: 故事背景（详细描述时代、地点、核心冲突）
3. theme: 故事主题（一句话概括）
4. characters: 角色列表，每个角色包含：
   - name: 姓名
   - identity: 身份（如：落魄总裁、神秘少女）
   - description: 性格特征（详细描述性格、动机、优缺点）
   - appearance: 外貌细节（用于生图提示词，包括：年龄、发型、肤色、穿着风格、面部特征）
   - personality_tags: 3-5个核心性格标签
   - motivation: 核心欲望或行动动机
5. episodeScripts: 剧本分集内容，共 ${episodesCount} 集，每一集包含：
   - id: 集数序号
   - title: 本集标题
   - content: 本集详细剧本内容（包含对话和动作描写）
   - key_conflict: 本集的核心冲突
   - ending_hook: 结尾悬念

请确保输出的 JSON 格式正确，不要包含任何 Markdown 代码块标签。`;
            
            const result = await AIService.callLLM(prompt, systemPrompt);
            console.log("[script] AI Response:", result);
            try {
              // 增强清理逻辑，移除可能的 Markdown 标记
              const cleanResponse = result.replace(/```json\n?|\n?```/g, "").trim();
              const scriptData = JSON.parse(cleanResponse);
              console.log("[script] Parsed Data:", scriptData);
              
              Object.assign(outputs, {
                script: scriptData.title,
                background: scriptData.background,
                theme: scriptData.theme,
                characters: scriptData.characters,
                episodeScripts: scriptData.episodeScripts
              });
              
              // 自动生成后续节点和流程
              setTimeout(() => {
                console.log("[script] Triggering auto-generation flow...");
                get().generateCharactersFlow(node.id, scriptData);
                get().generateEpisodesFlow(node.id, scriptData);
              }, 100);
            } catch (e) {
              console.error("[script] JSON Parse Error:", e);
              outputs.script = result;
              outputs.error = "解析 JSON 失败，返回原始文本";
            }
            break;
          }

          case "character": {
            const charInputConn = connections.find(c => c.targetNodeId === node.id);
            if (charInputConn) {
              const sourceNode = nodes.find(n => n.id === charInputConn.sourceNodeId);
              if (sourceNode?.type === "script" && sourceNode.data.characters) {
                const characters = sourceNode.data.characters as any[];
                const charData = characters.find(c => c.name === node.data.name) || characters[0];
                if (charData) {
                  outputs.name = charData.name;
                  outputs.description = charData.description;
                  outputs.appearance = charData.appearance;
                  outputs.personality = charData.personality;
                  outputs.prompt = `Portrait of ${charData.name}, ${charData.description}, ${charData.appearance}, highly detailed, cinematic lighting`;
                  outputs.characterImageUrl = await AIService.generateImage(outputs.prompt as string);
                }
              }
            }
            break;
          }

          case "episode": {
            const epInputConn = connections.find(c => c.targetNodeId === node.id);
            if (epInputConn) {
              const sourceNode = nodes.find(n => n.id === epInputConn.sourceNodeId);
              if (sourceNode?.type === "script" && sourceNode.data.episodeScripts) {
                const episodes = sourceNode.data.episodeScripts as any[];
                const currentEp = episodes.find(e => e.id === node.data.episodeNumber);
                if (currentEp) {
                  outputs.content = currentEp.content;
                  outputs.title = currentEp.title;
                }
              }
            }
            break;
          }

          case "storyboard": {
            const sbInputConn = connections.find(c => c.targetNodeId === node.id);
            if (sbInputConn) {
              const sourceNode = nodes.find(n => n.id === sbInputConn.sourceNodeId);
              const scriptContent = sourceNode?.data.content || sourceNode?.data.script || "";
              const sceneCount = (node.data.sceneCount as number) || 6;
              
              const systemPrompt = `你是一个专业的影视分镜师。请根据剧本内容生成详细的分镜脚本。
你需要输出 JSON 格式，包含一个 scenes 数组，每个分镜包含：
- id: 分镜编号
- content: 画面内容详细描述（包含：构图、光影、人物动作、场景描述，用于 AI 生成图片的提示词）
- duration: 预计时长（如 "3s"）

请确保输出的 JSON 格式正确，不要包含任何 Markdown 代码块标签。`;

              const result = await AIService.callLLM(`剧本内容：${scriptContent}\n分镜数量：${sceneCount}`, systemPrompt);
              console.log("[storyboard] AI Response:", result);
              try {
                const cleanResponse = result.replace(/```json\n?|\n?```/g, "").trim();
                const json = JSON.parse(cleanResponse);
                console.log("[storyboard] Parsed Data:", json);
                const scenes = json.scenes || [];
                outputs.scenes = scenes;
                
                // 自动生成分镜镜头节点
                setTimeout(() => {
                  console.log("[storyboard] Triggering scenes generation flow...");
                  get().generateScenesFlow(node.id, json);
                }, 100);
              } catch (e) {
                console.error("[storyboard] JSON Parse Error:", e);
                outputs.error = "解析分镜 JSON 失败";
              }
            }
            break;
          }

          case "image": {
            if (node.data.isLocalUpload) {
              outputs.imageUrl = node.data.localImageUrl;
            } else {
              // 优先使用节点自身携带的 prompt (通常由 generateScenesFlow 生成)
              let prompt = (node.data.prompt as string) || "Cinematic shot, highly detailed";
              
              // 如果没有自身 prompt，尝试从前置分镜节点获取
              const sbInput = connections.find(c => c.targetNodeId === node.id && nodes.find(n => n.id === c.sourceNodeId)?.type === "storyboard");
              if (!node.data.prompt && sbInput) {
                const source = nodes.find(n => n.id === sbInput.sourceNodeId);
                const scenes = source?.data.scenes as any[];
                if (scenes && scenes.length > 0) {
                  // 如果是汇总节点，默认取第一个，或者可以根据某种逻辑选择
                  prompt = scenes[0].content;
                }
              }
              outputs.imageUrl = await AIService.generateImage(prompt);
            }
            break;
          }

          case "audio": {
            const inputConn = connections.find(c => c.targetNodeId === node.id);
            let text = "";
            if (inputConn) {
              const source = nodes.find(n => n.id === inputConn.sourceNodeId);
              if (source?.type === "storyboard") {
                text = (source.data.scenes as any[])?.map(s => s.content).join("\n") || "";
              } else if (source?.type === "episode") {
                text = source.data.content as string;
              }
            }
            outputs.text = text || "暂无配音文本";
            outputs.audioUrl = await AIService.generateTTS(outputs.text as string);
            break;
          }

          case "video": {
            const imgInput = connections.find(c => c.targetNodeId === node.id && nodes.find(n => n.id === c.sourceNodeId)?.type === "image");
            const audioInput = connections.find(c => c.targetNodeId === node.id && nodes.find(n => n.id === c.sourceNodeId)?.type === "audio");
            
            const imageUrl = imgInput ? nodes.find(n => n.id === imgInput.sourceNodeId)?.data.imageUrl as string : "";
            const audioUrl = audioInput ? nodes.find(n => n.id === audioInput.sourceNodeId)?.data.audioUrl as string : "";
            
            outputs.videoUrl = await AIService.generateVideo(imageUrl, audioUrl);
            break;
          }
        }

        updateNodeData(node.id, outputs);
        setNodeStatus(node.id, "completed");
      } catch (error: any) {
        console.error(`Error running node ${node.id}:`, error);
        updateNodeData(node.id, { error: error.message });
        setNodeStatus(node.id, "error");
        return; // 停止后续节点执行
      }

      // 获取最新的节点和连接状态，以便处理自动生成的节点
      const latestNodes = get().nodes;
      const latestConnections = get().connections;

      const outgoingConnections = latestConnections.filter((c) => c.sourceNodeId === node.id);
      const connectedNodeIds = outgoingConnections.map((c) => c.targetNodeId);
      const connectedNodes = latestNodes.filter((n) => connectedNodeIds.includes(n.id));

      if (node.isAsync) {
        await Promise.all(connectedNodes.map(runNode));
      } else {
        for (const connectedNode of connectedNodes) {
          await runNode(connectedNode);
        }
      }
    };

    const initialNodes = get().nodes;
    const initialConnections = get().connections;
    const startingNodes = initialNodes.filter(
      (node) => !initialConnections.some((c) => c.targetNodeId === node.id)
    );

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

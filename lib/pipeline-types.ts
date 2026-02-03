// 节点类型定义
export type NodeType =
  | "text-input"
  | "image-upload"
  | "script"
  | "storyboard"
  | "image"
  | "video"
  | "audio"
  | "merge"
  | "condition"
  | "export-video"
  | "export-audio"
  | "export-image";

export interface Position {
  x: number;
  y: number;
}

export interface NodePort {
  id: string;
  type: "input" | "output";
  dataType: "text" | "storyboard" | "image" | "video" | "audio" | "any";
  label: string;
  connected: boolean;
}

export interface PipelineNode {
  id: string;
  type: NodeType;
  title: string;
  position: Position;
  inputs: NodePort[];
  outputs: NodePort[];
  data: Record<string, unknown>;
  status: "idle" | "running" | "completed" | "error";
  isAsync: boolean;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface CanvasState {
  nodes: PipelineNode[];
  connections: Connection[];
  scale: number;
  offset: Position;
  selectedNodeId: string | null;
  connectingFrom: { nodeId: string; portId: string; portType: "input" | "output" } | null;
}

// 项目数据
export interface Project {
  id: string;
  name: string;
  nodes: PipelineNode[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
}

// 历史记录
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  nodes: PipelineNode[];
  connections: Connection[];
}

// 节点配置模板
export const NODE_CONFIGS: Record<
  NodeType,
  {
    title: string;
    category: string;
    icon: string;
    color: string;
    inputs: Omit<NodePort, "id" | "connected">[];
    outputs: Omit<NodePort, "id" | "connected">[];
    defaultData: Record<string, unknown>;
  }
> = {
  "text-input": {
    title: "文本输入",
    category: "input",
    icon: "Type",
    color: "node-input",
    inputs: [],
    outputs: [{ type: "output", dataType: "text", label: "文本" }],
    defaultData: {
      text: "",
    },
  },
  "image-upload": {
    title: "图片上传",
    category: "input",
    icon: "Upload",
    color: "node-input",
    inputs: [],
    outputs: [{ type: "output", dataType: "image", label: "图片" }],
    defaultData: {
      imageUrl: "",
      fileName: "",
    },
  },
  script: {
    title: "剧本生成",
    category: "ai",
    icon: "FileText",
    color: "node-script",
    inputs: [{ type: "input", dataType: "text", label: "提示词" }],
    outputs: [{ type: "output", dataType: "text", label: "剧本" }],
    defaultData: {
      prompt: "",
      genre: "drama",
      duration: "3min",
      generatedScript: "",
    },
  },
  storyboard: {
    title: "分镜脚本",
    category: "ai",
    icon: "LayoutGrid",
    color: "node-storyboard",
    inputs: [{ type: "input", dataType: "text", label: "剧本" }],
    outputs: [{ type: "output", dataType: "storyboard", label: "分镜" }],
    defaultData: {
      sceneCount: 6,
      aspectRatio: "16:9",
      scenes: [],
    },
  },
  image: {
    title: "图片生成",
    category: "ai",
    icon: "ImageIcon",
    color: "node-image",
    inputs: [{ type: "input", dataType: "storyboard", label: "分镜" }],
    outputs: [{ type: "output", dataType: "image", label: "图片" }],
    defaultData: {
      style: "cinematic",
      quality: "high",
      images: [],
    },
  },
  video: {
    title: "视频生成",
    category: "ai",
    icon: "Video",
    color: "node-video",
    inputs: [
      { type: "input", dataType: "image", label: "图片" },
      { type: "input", dataType: "audio", label: "音频" },
    ],
    outputs: [{ type: "output", dataType: "video", label: "视频" }],
    defaultData: {
      fps: 24,
      transition: "fade",
      videoUrl: "",
    },
  },
  audio: {
    title: "AI配音",
    category: "ai",
    icon: "Mic",
    color: "node-audio",
    inputs: [{ type: "input", dataType: "text", label: "文本" }],
    outputs: [{ type: "output", dataType: "audio", label: "音频" }],
    defaultData: {
      voice: "narrator",
      speed: 1.0,
      audioUrl: "",
    },
  },
  merge: {
    title: "合并节点",
    category: "flow",
    icon: "GitMerge",
    color: "node-flow",
    inputs: [
      { type: "input", dataType: "any", label: "输入1" },
      { type: "input", dataType: "any", label: "输入2" },
    ],
    outputs: [{ type: "output", dataType: "any", label: "输出" }],
    defaultData: {
      mergeMode: "concat",
    },
  },
  condition: {
    title: "条件分支",
    category: "flow",
    icon: "GitBranch",
    color: "node-flow",
    inputs: [{ type: "input", dataType: "any", label: "输入" }],
    outputs: [
      { type: "output", dataType: "any", label: "是" },
      { type: "output", dataType: "any", label: "否" },
    ],
    defaultData: {
      condition: "",
    },
  },
  "export-video": {
    title: "视频导出",
    category: "output",
    icon: "Download",
    color: "node-export",
    inputs: [{ type: "input", dataType: "video", label: "视频" }],
    outputs: [],
    defaultData: {
      format: "mp4",
      resolution: "1080p",
      codec: "h264",
      bitrate: "8000",
      exportPath: "",
    },
  },
  "export-audio": {
    title: "音频导出",
    category: "output",
    icon: "FileAudio",
    color: "node-export",
    inputs: [{ type: "input", dataType: "audio", label: "音频" }],
    outputs: [],
    defaultData: {
      format: "mp3",
      sampleRate: "44100",
      bitrate: "320",
      exportPath: "",
    },
  },
  "export-image": {
    title: "图片导出",
    category: "output",
    icon: "FileImage",
    color: "node-export",
    inputs: [{ type: "input", dataType: "image", label: "图片" }],
    outputs: [],
    defaultData: {
      format: "png",
      quality: "100",
      exportPath: "",
    },
  },
};

// 节点分类
export const NODE_CATEGORIES = [
  {
    id: "input",
    name: "输入",
    description: "数据输入节点",
    nodes: ["text-input", "image-upload"] as NodeType[],
  },
  {
    id: "ai",
    name: "AI处理",
    description: "AI生成节点",
    nodes: ["script", "storyboard", "image", "video", "audio"] as NodeType[],
  },
  {
    id: "flow",
    name: "流程控制",
    description: "流程控制节点",
    nodes: ["merge", "condition"] as NodeType[],
  },
  {
    id: "output",
    name: "输出",
    description: "结果输出节点",
    nodes: ["export-video", "export-audio", "export-image"] as NodeType[],
  },
];

// 创建新节点
export function createNode(type: NodeType, position: Position): PipelineNode {
  const config = NODE_CONFIGS[type];
  const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type,
    title: config.title,
    position,
    inputs: config.inputs.map((input, index) => ({
      ...input,
      id: `${id}-input-${index}`,
      connected: false,
    })),
    outputs: config.outputs.map((output, index) => ({
      ...output,
      id: `${id}-output-${index}`,
      connected: false,
    })),
    data: { ...config.defaultData },
    status: "idle",
    isAsync: true,
  };
}

// 创建连接ID
export function createConnectionId(
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string
): string {
  return `conn-${sourceNodeId}-${sourcePortId}-${targetNodeId}-${targetPortId}`;
}

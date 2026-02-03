// 节点类型定义
export type NodeType =
  | "text-input"
  | "image-upload"
  | "script"
  | "character"
  | "episode"
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
  dataType: "text" | "storyboard" | "scene" | "image" | "video" | "audio" | "any";
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
  isCollapsed?: boolean;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export type LineStyle = "bezier" | "straight" | "polyline";

export interface CanvasState {
  nodes: PipelineNode[];
  connections: Connection[];
  scale: number;
  offset: Position;
  selectedNodeId: string | null;
  connectingFrom: { nodeId: string; portId: string; portType: "input" | "output" } | null;
  lineStyle: LineStyle;
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
    outputs: [{ type: "output", dataType: "any", label: "脚本数据" }], // 修改为单一输出
    defaultData: {
      prompt: "",
      scriptType: "short-drama", // "short-drama" | "movie" | "short-video"
      episodes: 6,
      episodeDuration: "2min",
      genre: "drama",
      duration: "3min",
      generatedScript: "",
      episodeScripts: [], // 存储每一集的剧本内容
    },
  },
  character: {
    title: "角色节点",
    category: "ai",
    icon: "UserCircle",
    color: "node-character",
    inputs: [{ type: "input", dataType: "text", label: "剧本数据" }],
    outputs: [
      { type: "output", dataType: "text", label: "角色信息" },
      { type: "output", dataType: "image", label: "角色图" },
    ],
    defaultData: {
      name: "",
      description: "",
      appearance: "",
      personality: "",
      prompt: "", // 用于生图的提示词
      characterImageUrl: "", // 存储生成的角色图或手动上传的图
    },
  },
  episode: {
    title: "剧集节点",
    category: "ai",
    icon: "Layers",
    color: "node-script",
    inputs: [{ type: "input", dataType: "text", label: "剧本数据" }],
    outputs: [{ type: "output", dataType: "text", label: "本集剧本" }],
    defaultData: {
      episodeNumber: 1,
      title: "第一集",
      content: "",
    },
  },
  storyboard: {
    title: "分镜脚本",
    category: "ai",
    icon: "ScanFace",
    color: "node-storyboard",
    inputs: [{ type: "input", dataType: "text", label: "剧本" }],
    outputs: [{ type: "output", dataType: "scene", label: "分镜数据" }], // 改为单一输出
    defaultData: {
      sceneCount: 6,
      aspectRatio: "16:9",
      scenes: [],
    },
  },
  image: {
    title: "分镜头生成",
    category: "ai",
    icon: "ImageIcon",
    color: "node-image",
    inputs: [
      { type: "input", dataType: "scene", label: "分镜" },
      { type: "input", dataType: "image", label: "角色参考" },
    ],
    outputs: [{ type: "output", dataType: "image", label: "图片" }],
    defaultData: {
      style: "cinematic",
      quality: "high",
      images: [],
      localImageUrl: "", // 本地上传的图片URL
      isLocalUpload: false, // 是否使用本地上传
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
    inputs: [{ type: "input", dataType: "scene", label: "分镜数据" }],
    outputs: [{ type: "output", dataType: "audio", label: "音频" }],
    defaultData: {
      voice: "narrator",
      speed: 1.0,
      pitch: 0,
      audioUrl: "",
      text: "", // 提取出的文字
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
    nodes: ["script", "character", "episode", "storyboard", "image", "video", "audio"] as NodeType[],
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

  // 特殊处理分镜脚本节点，根据默认数量创建输出端口
  let outputs = config.outputs.map((output, index) => ({
    ...output,
    id: `${id}-output-${index}`,
    connected: false,
  }));

  if (type === "storyboard") {
    outputs = [{
      id: `${id}-output-0`,
      type: "output" as const,
      dataType: "scene" as const,
      label: "分镜数据",
      connected: false,
    }];
  } else if (type === "script") {
    outputs = [{
      id: `${id}-output-0`,
      type: "output" as const,
      dataType: "any" as const,
      label: "脚本数据",
      connected: false,
    }];
  }

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
    outputs,
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

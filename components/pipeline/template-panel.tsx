"use client";

import React, { useState, useRef } from "react";
import {
  Layout,
  Film,
  Mic2,
  Video,
  Sparkles,
  BookOpen,
  Clapperboard,
  Music,
  Plus,
  ImageIcon,
  UserCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePipelineStore } from "@/lib/pipeline-store";
import type { NodeType, PipelineNode, Connection } from "@/lib/pipeline-types";
import { createNode, createConnectionId } from "@/lib/pipeline-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  nodes: {
    type: NodeType;
    position: { x: number; y: number };
  }[];
  connections: {
    sourceIndex: number;
    sourcePort: number;
    targetIndex: number;
    targetPort: number;
  }[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "basic-drama",
    name: "基础短剧流程",
    description: "从剧本到导出的完整短剧制作流程",
    icon: <Film className="h-5 w-5" />,
    category: "短剧制作",
    nodes: [
      { type: "text-input", position: { x: 50, y: 150 } },
      { type: "script", position: { x: 300, y: 150 } },
      { type: "character", position: { x: 300, y: -200 } },
      { type: "episode", position: { x: 600, y: 150 } },
      { type: "storyboard", position: { x: 900, y: 150 } },
      { type: "image", position: { x: 1200, y: 50 } },
      { type: "audio", position: { x: 1200, y: 250 } },
      { type: "video", position: { x: 1500, y: 150 } },
      { type: "export-video", position: { x: 1800, y: 150 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 4, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 1, targetIndex: 5, targetPort: 1 }, // 角色图连接到分镜头生成
      { sourceIndex: 4, sourcePort: 0, targetIndex: 5, targetPort: 0 },
      { sourceIndex: 4, sourcePort: 0, targetIndex: 6, targetPort: 0 },
      { sourceIndex: 5, sourcePort: 0, targetIndex: 7, targetPort: 0 },
      { sourceIndex: 6, sourcePort: 0, targetIndex: 7, targetPort: 1 },
      { sourceIndex: 7, sourcePort: 0, targetIndex: 8, targetPort: 0 },
    ],
  },
  {
    id: "quick-video",
    name: "快速视频生成",
    description: "从图片快速生成视频",
    icon: <Video className="h-5 w-5" />,
    category: "视频制作",
    nodes: [
      { type: "image-upload", position: { x: 100, y: 100 } },
      { type: "text-input", position: { x: 100, y: 300 } },
      { type: "audio", position: { x: 400, y: 300 } },
      { type: "video", position: { x: 700, y: 200 } },
      { type: "export-video", position: { x: 1000, y: 200 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 1 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 4, targetPort: 0 },
    ],
  },
  {
    id: "voice-over",
    name: "配音工作流",
    description: "文本转语音并导出音频",
    icon: <Mic2 className="h-5 w-5" />,
    category: "音频处理",
    nodes: [
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "audio", position: { x: 400, y: 100 } },
      { type: "export-audio", position: { x: 700, y: 100 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
    ],
  },
  {
    id: "storyboard-only",
    name: "分镜创作",
    description: "从剧本生成分镜脚本和图片",
    icon: <Layout className="h-5 w-5" />,
    category: "分镜设计",
    nodes: [
      { type: "text-input", position: { x: 100, y: 150 } },
      { type: "script", position: { x: 400, y: 150 } },
      { type: "character", position: { x: 400, y: -100 } },
      { type: "storyboard", position: { x: 700, y: 150 } },
      { type: "image", position: { x: 1000, y: 150 } },
      { type: "export-image", position: { x: 1300, y: 150 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 1, targetIndex: 4, targetPort: 1 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 4, targetPort: 0 },
      { sourceIndex: 4, sourcePort: 0, targetIndex: 5, targetPort: 0 },
    ],
  },
  {
    id: "parallel-process",
    name: "并行处理流程",
    description: "使用合并节点并行处理多个输入",
    icon: <Sparkles className="h-5 w-5" />,
    category: "高级流程",
    nodes: [
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "text-input", position: { x: 100, y: 300 } },
      { type: "script", position: { x: 400, y: 100 } },
      { type: "script", position: { x: 400, y: 300 } },
      { type: "merge", position: { x: 700, y: 200 } },
      { type: "storyboard", position: { x: 1000, y: 200 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 4, targetPort: 0 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 4, targetPort: 1 },
      { sourceIndex: 4, sourcePort: 0, targetIndex: 5, targetPort: 0 },
    ],
  },
  {
    id: "audiobook",
    name: "有声读物",
    description: "将文本转换为有声内容",
    icon: <BookOpen className="h-5 w-5" />,
    category: "音频处理",
    nodes: [
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "script", position: { x: 400, y: 100 } },
      { type: "audio", position: { x: 700, y: 100 } },
      { type: "export-audio", position: { x: 1000, y: 100 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 0 },
    ],
  },
  {
    id: "movie-trailer",
    name: "电影预告片",
    description: "快速制作电影预告片风格的短视频",
    icon: <Clapperboard className="h-5 w-5" />,
    category: "短剧制作",
    nodes: [
            { type: "text-input", position: { x: 50, y: 150 } },
            { type: "script", position: { x: 300, y: 150 } },
            { type: "character", position: { x: 300, y: -200 } },
            { type: "episode", position: { x: 650, y: 50 } },
            { type: "episode", position: { x: 650, y: 300 } },
            { type: "storyboard", position: { x: 950, y: 50 } },
            { type: "image", position: { x: 1250, y: 0 } },
            { type: "audio", position: { x: 1250, y: 150 } },
            { type: "video", position: { x: 1550, y: 75 } },
            { type: "export-video", position: { x: 1850, y: 75 } },
          ],
          connections: [
            { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
            { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
            { sourceIndex: 1, sourcePort: 0, targetIndex: 3, targetPort: 0 },
            { sourceIndex: 1, sourcePort: 0, targetIndex: 4, targetPort: 0 },
            { sourceIndex: 3, sourcePort: 0, targetIndex: 5, targetPort: 0 },
            { sourceIndex: 2, sourcePort: 1, targetIndex: 6, targetPort: 1 },
            { sourceIndex: 5, sourcePort: 0, targetIndex: 6, targetPort: 0 },
            { sourceIndex: 5, sourcePort: 0, targetIndex: 7, targetPort: 0 },
            { sourceIndex: 6, sourcePort: 0, targetIndex: 8, targetPort: 0 },
            { sourceIndex: 7, sourcePort: 0, targetIndex: 8, targetPort: 1 },
            { sourceIndex: 8, sourcePort: 0, targetIndex: 9, targetPort: 0 },
          ],
  },
  {
    id: "music-video",
    name: "音乐视频",
    description: "为音乐创建配套视频内容",
    icon: <Music className="h-5 w-5" />,
    category: "视频制作",
    nodes: [
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "storyboard", position: { x: 400, y: 100 } },
      { type: "image", position: { x: 700, y: 100 } },
      { type: "video", position: { x: 1000, y: 100 } },
      { type: "export-video", position: { x: 1300, y: 100 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 4, targetPort: 0 },
    ],
  },
  {
    id: "image-batch",
    name: "批量图片生成",
    description: "从分镜批量生成图片并导出",
    icon: <ImageIcon className="h-5 w-5" />,
    category: "分镜设计",
    nodes: [
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "storyboard", position: { x: 400, y: 100 } },
      { type: "image", position: { x: 700, y: 100 } },
      { type: "export-image", position: { x: 1000, y: 100 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 0 },
    ],
  },
];

const CATEGORIES = [
  "全部",
  "短剧制作",
  "视频制作",
  "分镜设计",
  "音频处理",
  "高级流程",
];

interface TemplatePanelProps {
  className?: string;
}

export function TemplatePanel({ className }: TemplatePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [scale, setScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const middleZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = WORKFLOW_TEMPLATES.filter(
    (t) => selectedCategory === "全部" || t.category === selectedCategory
  );

  // 中间区域：缩放逻辑
  const handleMiddleWheel = (e: WheelEvent) => {
    // 强制执行缩放
    e.preventDefault();
    e.stopPropagation();
    // 检查是否按下 Ctrl 键（可选，但通常缩放建议配合 Ctrl，不过用户要求滚动缩放，这里直接处理）
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.4), 2.0));
  };

  // 右侧区域：驱动滚动逻辑
  const handleRightWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      // 增加滚动速度
      scrollRef.current.scrollTop += e.deltaY * 1.5;
    }
  };

  // 绑定区域的非 passive wheel 事件
  React.useEffect(() => {
    const middleZone = middleZoneRef.current;
    const rightZone = rightZoneRef.current;
    
    if (isOpen) {
      if (middleZone) {
        middleZone.addEventListener("wheel", handleMiddleWheel, { passive: false });
      }
      if (rightZone) {
        rightZone.addEventListener("wheel", handleRightWheel, { passive: false });
      }
      return () => {
        if (middleZone) middleZone.removeEventListener("wheel", handleMiddleWheel);
        if (rightZone) rightZone.removeEventListener("wheel", handleRightWheel);
      };
    }
  }, [isOpen]);

  const applyTemplate = (template: WorkflowTemplate) => {
    const { clearCanvas, pushHistory } = usePipelineStore.getState();
    clearCanvas();
    const createdNodes: PipelineNode[] = template.nodes.map((nodeConfig) =>
      createNode(nodeConfig.type, nodeConfig.position)
    );
    const createdConnections: Connection[] = template.connections.map((conn) => {
      const sourceNode = createdNodes[conn.sourceIndex];
      const targetNode = createdNodes[conn.targetIndex];
      const sourcePortId = sourceNode.outputs[conn.sourcePort]?.id;
      const targetPortId = targetNode.inputs[conn.targetPort]?.id;
      if (sourcePortId) {
        const port = sourceNode.outputs.find((p) => p.id === sourcePortId);
        if (port) port.connected = true;
      }
      if (targetPortId) {
        const port = targetNode.inputs.find((p) => p.id === targetPortId);
        if (port) port.connected = true;
      }
      return {
        id: createConnectionId(
          sourceNode.id,
          sourcePortId,
          targetNode.id,
          targetPortId
        ),
        sourceNodeId: sourceNode.id,
        sourcePortId,
        targetNodeId: targetNode.id,
        targetPortId,
      };
    });
    usePipelineStore.setState({
      nodes: createdNodes,
      connections: createdConnections,
    });
    pushHistory(`应用模板: ${template.name}`);
    setIsOpen(false);
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10 border-border/50 bg-card/95 shadow-xl backdrop-blur-sm",
                  className
                )}
              >
                <Layout className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>模板库</TooltipContent>
        </Tooltip>
        <DialogContent className="flex h-[80vh] w-[90vw] max-w-4xl flex-row overflow-hidden p-0 sm:max-w-5xl">
          {/* Left Sidebar - Categories (独立滚动) */}
          <div className="flex w-52 shrink-0 flex-col border-r bg-muted/30 p-5 overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-5 shrink-0">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Layout className="h-5 w-5 text-primary" />
                模板库
              </DialogTitle>
              <DialogDescription className="text-xs">
                快速开始创作
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className={cn(
                    "justify-start gap-2.5 px-3 py-5 transition-all duration-300",
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]" 
                      : "hover:bg-muted/50 text-muted-foreground hover:translate-x-1"
                  )}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    selectedCategory === category ? "bg-primary-foreground scale-125" : "bg-muted-foreground/30"
                  )} />
                  <span className="font-semibold text-sm">{category}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Right Area Wrapper */}
          <div className="relative flex flex-1 min-w-0 flex-col bg-background/50 overflow-hidden">
            {/* Header (Non-zoomable) */}
            <div className="z-10 shrink-0 p-6 pb-2 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-foreground/90">{selectedCategory} 模板</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  滚轮缩放视图 • 右侧边缘滚动面板
                </p>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-4 py-1.5 text-[10px] font-bold text-muted-foreground border border-border/50">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>{filteredTemplates.length} 个预设流程</span>
              </div>
            </div>

            {/* Content Area with Zoom & Scroll Zones */}
            <div className="relative flex-1 flex overflow-hidden">
              
              {/* Middle Zone (Zoomable Content) */}
              <div 
                className="flex-1 overflow-y-auto custom-scrollbar pr-8 pl-6 pb-6" 
                ref={scrollRef}
              >
                <div 
                  className="grid grid-cols-1 gap-4 lg:grid-cols-2 origin-top-left transition-transform duration-200 ease-out"
                  ref={middleZoneRef}
                  style={{ transform: `scale(${scale})`, width: `${100 / scale}%` }}
                >
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "group relative flex flex-row items-center gap-4 cursor-pointer rounded-2xl border border-border/50 bg-card/40 p-4",
                        "transition-all duration-500 hover:border-primary/40 hover:bg-card hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                      )}
                      onClick={() => applyTemplate(template)}
                    >
                      {/* Icon */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-primary/5 text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/10 group-hover:rotate-6 shadow-inner">
                        {React.cloneElement(template.icon as React.ReactElement, { className: "h-8 w-8" })}
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-lg font-black tracking-tight group-hover:text-primary transition-colors">
                            {template.name}
                          </h3>
                          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[8px] font-black text-primary uppercase tracking-widest border border-primary/20">
                            {template.nodes.length} NODES
                          </span>
                        </div>
                        
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/70 group-hover:text-muted-foreground transition-colors font-medium">
                          {template.description}
                        </p>
                        
                        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-primary opacity-0 transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-100">
                          <span className="uppercase tracking-[0.15em]">立即应用流程</span>
                          <Plus className="h-3 w-3" />
                        </div>
                      </div>

                      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Scroll Zone (感应区) */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-12 z-20 cursor-ns-resize group/scroll"
                ref={rightZoneRef}
              >
                <div className="absolute right-2 top-4 bottom-4 w-1 rounded-full bg-muted-foreground/10 group-hover/scroll:bg-primary/30 transition-colors" />
                {/* 浮动提示 */}
                <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/scroll:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap font-bold uppercase tracking-tighter">
                    此处滚动面板 ↑↓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

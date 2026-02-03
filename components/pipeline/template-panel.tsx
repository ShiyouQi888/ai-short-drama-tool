"use client";

import React from "react";
import { useState } from "react";
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
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "script", position: { x: 400, y: 100 } },
      { type: "storyboard", position: { x: 700, y: 100 } },
      { type: "image", position: { x: 1000, y: 100 } },
      { type: "audio", position: { x: 700, y: 300 } },
      { type: "video", position: { x: 1300, y: 200 } },
      { type: "export-video", position: { x: 1600, y: 200 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 4, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 5, targetPort: 0 },
      { sourceIndex: 4, sourcePort: 0, targetIndex: 5, targetPort: 1 },
      { sourceIndex: 5, sourcePort: 0, targetIndex: 6, targetPort: 0 },
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
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "script", position: { x: 400, y: 100 } },
      { type: "storyboard", position: { x: 700, y: 100 } },
      { type: "image", position: { x: 1000, y: 100 } },
      { type: "export-image", position: { x: 1300, y: 100 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 4, targetPort: 0 },
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
      { type: "text-input", position: { x: 100, y: 100 } },
      { type: "script", position: { x: 400, y: 100 } },
      { type: "storyboard", position: { x: 700, y: 100 } },
      { type: "image", position: { x: 1000, y: 100 } },
      { type: "text-input", position: { x: 700, y: 300 } },
      { type: "audio", position: { x: 1000, y: 300 } },
      { type: "video", position: { x: 1300, y: 200 } },
      { type: "export-video", position: { x: 1600, y: 200 } },
    ],
    connections: [
      { sourceIndex: 0, sourcePort: 0, targetIndex: 1, targetPort: 0 },
      { sourceIndex: 1, sourcePort: 0, targetIndex: 2, targetPort: 0 },
      { sourceIndex: 2, sourcePort: 0, targetIndex: 3, targetPort: 0 },
      { sourceIndex: 4, sourcePort: 0, targetIndex: 5, targetPort: 0 },
      { sourceIndex: 3, sourcePort: 0, targetIndex: 6, targetPort: 0 },
      { sourceIndex: 5, sourcePort: 0, targetIndex: 6, targetPort: 1 },
      { sourceIndex: 6, sourcePort: 0, targetIndex: 7, targetPort: 0 },
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

  const filteredTemplates = WORKFLOW_TEMPLATES.filter(
    (t) => selectedCategory === "全部" || t.category === selectedCategory
  );

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
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              工作流模板库
            </DialogTitle>
            <DialogDescription>
              选择一个预设的工作流模板快速开始创作
            </DialogDescription>
          </DialogHeader>

          {/* Category tabs */}
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Template grid */}
          <div className="custom-scrollbar mt-4 flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "group relative cursor-pointer rounded-lg border border-border/50 bg-card/50 p-4",
                    "transition-all hover:border-primary/50 hover:bg-card"
                  )}
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {template.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">
                        {template.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {template.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {template.nodes.length} 个节点
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      使用此模板
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

"use client";

import React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  ImageIcon,
  LayoutGrid,
  Loader2,
  Mic,
  MoreVertical,
  Play,
  Trash2,
  Video,
  Check,
  AlertCircle,
  Zap,
  Clock,
  Type,
  Upload,
  GitMerge,
  GitBranch,
  FileAudio,
  FileImage,
  Layers,
  Wand2,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType, PipelineNode as PipelineNodeType } from "@/lib/pipeline-types";
import { NODE_CONFIGS } from "@/lib/pipeline-types";
import { usePipelineStore } from "@/lib/pipeline-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Upload,
  FileText,
  LayoutGrid,
  ImageIcon,
  Video,
  Mic,
  GitMerge,
  GitBranch,
  Download,
  FileAudio,
  FileImage,
  Layers,
  Wand2,
  UserCircle,
  Users,
};

interface PipelineNodeProps {
  node: PipelineNodeType;
  scale: number;
}

export function PipelineNode({ node, scale }: PipelineNodeProps) {
  const {
    updateNodePosition,
    selectNode,
    selectedNodeId,
    removeNode,
    startConnection,
    completeConnection,
    connectingFrom,
    toggleNodeAsync,
    updateNodeData,
    updateNodePorts,
    toggleNodeCollapsed,
  } = usePipelineStore();

  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeStart = useRef({ x: node.position.x, y: node.position.y });

  const config = NODE_CONFIGS[node.type];
  const IconComponent = ICONS[config.icon];
  const isSelected = selectedNodeId === node.id;

  const renderNodeSpecificFields = () => {
    const handleFieldInteraction = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
    };

    switch (node.type) {
      case "text-input":
        return (
          <div className="space-y-2" onMouseDown={handleFieldInteraction}>
            <Label htmlFor="text" className="text-[10px] uppercase tracking-wider text-muted-foreground">文本内容</Label>
            <Textarea
              id="text"
              placeholder="输入文本内容..."
              value={(node.data.text as string) || ""}
              onChange={(e) => updateNodeData(node.id, { text: e.target.value })}
              className="min-h-[80px] resize-none bg-background/80 text-xs"
            />
          </div>
        );

      case "image-upload":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">上传图片</Label>
              <div className="flex h-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-background/80 hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    点击上传
                  </p>
                </div>
              </div>
            </div>
            {node.data.imageUrl && (
              <div className="space-y-1">
                <p className="truncate text-[10px] text-muted-foreground italic">
                  {node.data.fileName as string}
                </p>
              </div>
            )}
          </div>
        );

      case "script":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            <div className="space-y-1.5">
              <Label htmlFor="prompt" className="text-[10px] uppercase tracking-wider text-muted-foreground">故事提示词</Label>
              <Textarea
                id="prompt"
                placeholder="描述你想要创作的故事..."
                value={(node.data.prompt as string) || ""}
                onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
                className="min-h-[60px] resize-none bg-background/80 text-xs"
              />
            </div>
            {node.data.script && (
              <div className="space-y-1.5 rounded-md bg-accent/20 p-2 border border-accent/30">
                <Label className="text-[10px] uppercase tracking-wider text-primary font-bold">生成剧本预览</Label>
                <div className="max-h-[100px] overflow-y-auto text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap scrollbar-thin">
                  {node.data.script as string}
                </div>
              </div>
            )}
            {node.data.episodeScripts && (node.data.episodeScripts as any[]).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Label className="text-[10px] uppercase tracking-wider text-primary font-bold">分集剧本预览</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {(node.data.episodeScripts as any[]).map((episode, i) => (
                    <div key={i} className="text-[11px] p-2 rounded bg-accent/10 border border-accent/20">
                      <div className="font-bold text-primary mb-1">{episode.title}</div>
                      <div className="text-foreground/80 line-clamp-2">{episode.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="scriptType" className="text-[10px] uppercase tracking-wider text-muted-foreground">创作类型</Label>
              <Select
                value={(node.data.scriptType as string) || "short-drama"}
                onValueChange={(value) => {
                  updateNodeData(node.id, { scriptType: value });
                }}
              >
                <SelectTrigger className="h-7 bg-background/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-drama">短剧</SelectItem>
                  <SelectItem value="movie">微电影</SelectItem>
                  <SelectItem value="short-video">短视频</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {node.data.scriptType === "short-drama" && (
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <div className="space-y-1.5">
                  <Label htmlFor="episodes" className="text-[10px] uppercase tracking-wider text-muted-foreground">总集数</Label>
                  <Input
                    id="episodes"
                    type="number"
                    value={(node.data.episodes as number) || 6}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateNodeData(node.id, { episodes: value });
                    }}
                    className="h-7 bg-background/80 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="episodeDuration" className="text-[10px] uppercase tracking-wider text-muted-foreground">单集时长</Label>
                  <Select
                    value={(node.data.episodeDuration as string) || "2min"}
                    onValueChange={(value) => updateNodeData(node.id, { episodeDuration: value })}
                  >
                    <SelectTrigger className="h-7 bg-background/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1min">1 分钟</SelectItem>
                      <SelectItem value="2min">2 分钟</SelectItem>
                      <SelectItem value="3min">3 分钟</SelectItem>
                      <SelectItem value="5min">5 分钟</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                className="h-8 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  usePipelineStore.getState().generateCharactersFlow(node.id);
                }}
              >
                <Users className="w-3 h-3" />
                生成角色
              </Button>
              <Button 
                className="h-8 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  usePipelineStore.getState().generateEpisodesFlow(node.id);
                }}
              >
                <Wand2 className="w-3 h-3" />
                生成剧集
              </Button>
            </div>
          </div>
        );

      case "character":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            {node.data.characterImageUrl && (
              <div className="overflow-hidden rounded-md border border-border/50">
                <img src={node.data.characterImageUrl as string} alt="Character" className="aspect-square w-full object-cover" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">角色姓名 & 身份</Label>
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/20 px-2 py-1 text-xs font-bold text-primary border border-primary/30">
                  {(node.data.name as string) || "未知角色"}
                </div>
                {node.data.identity && (
                  <div className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground border border-border/50">
                    {node.data.identity as string}
                  </div>
                )}
              </div>
            </div>
            {node.data.personality_tags && (node.data.personality_tags as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(node.data.personality_tags as string[]).map((tag, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">核心动机</Label>
              <div className="rounded-md bg-background/90 p-2 text-[10px] italic text-muted-foreground border border-border/30">
                {(node.data.motivation as string) || "暂无明确动机..."}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">性格与背景</Label>
              <div className="rounded-md bg-background/95 p-2 text-[11px] leading-relaxed max-h-[100px] overflow-y-auto scrollbar-thin border border-border/50">
                {(node.data.description as string) || "暂无描述..."}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">外貌细节 (生图提示词)</Label>
              <div className="rounded-md bg-accent/20 p-2 text-[11px] text-foreground border border-accent/30">
                {(node.data.appearance as string) || "暂无细节..."}
              </div>
            </div>
          </div>
        );
      case "episode":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">集数信息</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-primary/20 px-2 py-1 text-xs font-bold text-primary border border-primary/30">
                  {(node.data.title as string) || `第 ${node.data.episodeNumber} 集`}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">本集剧本内容</Label>
              <div className="rounded-md bg-background/90 p-2 text-[11px] leading-relaxed min-h-[100px] max-h-[200px] overflow-y-auto scrollbar-thin border border-border/50">
                {(node.data.content as string) || "等待剧本输入..."}
              </div>
            </div>
          </div>
        );

      case "storyboard":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">分镜数量</Label>
                <span className="text-[10px] font-medium">{node.data.sceneCount as number}</span>
              </div>
              <Slider
                value={[(node.data.sceneCount as number) || 6]}
                onValueChange={([value]) => {
                  updateNodeData(node.id, { sceneCount: value });
                }}
                min={1}
                max={20}
                step={1}
                className="py-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aspectRatio" className="text-[10px] uppercase tracking-wider text-muted-foreground">画面比例</Label>
              <Select
                value={(node.data.aspectRatio as string) || "16:9"}
                onValueChange={(value) => updateNodeData(node.id, { aspectRatio: value })}
              >
                <SelectTrigger className="h-7 bg-background/90 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 横屏</SelectItem>
                  <SelectItem value="9:16">9:16 竖屏</SelectItem>
                  <SelectItem value="1:1">1:1 方形</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {node.data.scenes && (node.data.scenes as any[]).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Label className="text-[10px] uppercase tracking-wider text-primary font-bold">分镜内容预览</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {(node.data.scenes as any[]).map((scene, i) => (
                    <div key={i} className="text-[11px] p-2 rounded bg-accent/20 border border-accent/30">
                      <div className="font-bold text-primary mb-1">分镜 {i + 1}</div>
                      <div className="text-foreground/80 line-clamp-2">{scene.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">图片来源</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={node.data.isLocalUpload ? "outline" : "default"}
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => updateNodeData(node.id, { isLocalUpload: false })}
                >
                  AI 生成
                </Button>
                <Button
                  variant={node.data.isLocalUpload ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => updateNodeData(node.id, { isLocalUpload: true })}
                >
                  本地上传
                </Button>
              </div>
            </div>

            {node.data.isLocalUpload ? (
              <div className="space-y-2">
                <div className="flex h-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-background/90 hover:border-primary/50 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">点击上传本地分镜图</p>
                  </div>
                </div>
                {node.data.localImageUrl && (
                  <div className="overflow-hidden rounded-md border border-border/50">
                    <img src={node.data.localImageUrl as string} alt="Local Upload" className="aspect-video w-full object-cover" />
                  </div>
                )}
              </div>
            ) : (
              <>
                {node.data.imageUrl && (
                  <div className="overflow-hidden rounded-md border border-border/50">
                    <img src={node.data.imageUrl as string} alt="Generated" className="aspect-video w-full object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="style" className="text-[10px] uppercase tracking-wider text-muted-foreground">画风</Label>
                    <Select
                      value={(node.data.style as string) || "cinematic"}
                      onValueChange={(value) => updateNodeData(node.id, { style: value })}
                    >
                      <SelectTrigger className="h-7 bg-background/90 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cinematic">电影感</SelectItem>
                        <SelectItem value="anime">动漫</SelectItem>
                        <SelectItem value="realistic">写实</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quality" className="text-[10px] uppercase tracking-wider text-muted-foreground">画质</Label>
                    <Select
                      value={(node.data.quality as string) || "high"}
                      onValueChange={(value) => updateNodeData(node.id, { quality: value })}
                    >
                      <SelectTrigger className="h-7 bg-background/90 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="standard">标准</SelectItem>
                        <SelectItem value="high">高清</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "video":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            {node.data.videoUrl && (
              <div className="space-y-1.5 rounded-md bg-node-video/30 p-2 border border-node-video/40">
                <Label className="text-[10px] uppercase tracking-wider text-primary font-bold">视频预览</Label>
                <div className="aspect-video w-full bg-black rounded overflow-hidden flex items-center justify-center group/vid relative">
                  <Video className="h-8 w-8 text-white/20" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity bg-black/40">
                    <Button size="icon" variant="ghost" className="text-white h-8 w-8">
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">帧率</Label>
                <span className="text-[10px] font-medium">{node.data.fps as number} FPS</span>
              </div>
              <Slider
                value={[(node.data.fps as number) || 24]}
                onValueChange={([value]) => updateNodeData(node.id, { fps: value })}
                min={12}
                max={60}
                step={6}
                className="py-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transition" className="text-[10px] uppercase tracking-wider text-muted-foreground">转场效果</Label>
              <Select
                value={(node.data.transition as string) || "fade"}
                onValueChange={(value) => updateNodeData(node.id, { transition: value })}
              >
                <SelectTrigger className="h-7 bg-background/90 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">淡入淡出</SelectItem>
                  <SelectItem value="dissolve">溶解</SelectItem>
                  <SelectItem value="slide">滑动</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="space-y-3" onMouseDown={handleFieldInteraction}>
            {/* 提取的文本展示 */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">配音文本</Label>
              <div className="rounded-md bg-muted p-2 text-[11px] text-muted-foreground min-h-[40px] max-h-[80px] overflow-y-auto scrollbar-thin border border-border/50">
                {(node.data.text as string) || "等待输入..."}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="voice" className="text-[10px] uppercase tracking-wider text-muted-foreground">配音</Label>
              <Select
                value={(node.data.voice as string) || "narrator"}
                onValueChange={(value) => updateNodeData(node.id, { voice: value })}
              >
                <SelectTrigger className="h-7 bg-background/90 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrator">旁白 (男)</SelectItem>
                  <SelectItem value="narrator-female">旁白 (女)</SelectItem>
                  <SelectItem value="character-young">年轻角色</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {node.data.audioUrl && (
              <div className="space-y-1.5 rounded-md bg-primary/30 p-2 border border-primary/40">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wider text-primary font-bold">音频预览</Label>
                  <span className="text-[10px] text-muted-foreground">{(node.data.duration as number)?.toFixed(1)}s</span>
                </div>
                <audio controls className="h-6 w-full" src={node.data.audioUrl as string}>
                  您的浏览器不支持 audio 元素。
                </audio>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">语速</Label>
                <span className="text-[10px] font-medium">{((node.data.speed as number) || 1).toFixed(1)}x</span>
              </div>
              <Slider
                value={[(node.data.speed as number) || 1]}
                onValueChange={([value]) => updateNodeData(node.id, { speed: value })}
                min={0.5}
                max={2}
                step={0.1}
                className="py-1"
              />
            </div>
          </div>
        );

      case "merge":
        return (
          <div className="space-y-1.5" onMouseDown={handleFieldInteraction}>
            <Label htmlFor="mergeMode" className="text-[10px] uppercase tracking-wider text-muted-foreground">合并模式</Label>
            <Select
              value={(node.data.mergeMode as string) || "concat"}
              onValueChange={(value) => updateNodeData(node.id, { mergeMode: value })}
            >
              <SelectTrigger className="h-7 bg-background/90 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concat">顺序连接</SelectItem>
                <SelectItem value="blend">混合</SelectItem>
                <SelectItem value="overlay">叠加</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "condition":
        return (
          <div className="space-y-1.5" onMouseDown={handleFieldInteraction}>
            <Label htmlFor="condition" className="text-[10px] uppercase tracking-wider text-muted-foreground">条件表达式</Label>
            <Input
              id="condition"
              placeholder="输入条件..."
              value={(node.data.condition as string) || ""}
              onChange={(e) => updateNodeData(node.id, { condition: e.target.value })}
              className="h-7 bg-background/90 text-xs"
            />
          </div>
        );

      case "export-video":
      case "export-audio":
      case "export-image":
        return (
          <div className="grid grid-cols-2 gap-2" onMouseDown={handleFieldInteraction}>
            <div className="space-y-1.5">
              <Label htmlFor="format" className="text-[10px] uppercase tracking-wider text-muted-foreground">格式</Label>
              <Select
                value={(node.data.format as string) || "mp4"}
                onValueChange={(value) => updateNodeData(node.id, { format: value })}
              >
                <SelectTrigger className="h-7 bg-background/90 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resolution" className="text-[10px] uppercase tracking-wider text-muted-foreground">分辨率/质量</Label>
              <Select
                value={(node.data.resolution as string) || "1080p"}
                onValueChange={(value) => updateNodeData(node.id, { resolution: value })}
              >
                <SelectTrigger className="h-7 bg-background/90 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720P</SelectItem>
                  <SelectItem value="1080p">1080P</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".port-handle")) return;
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("[data-radix-menu-content]")) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      nodeStart.current = { x: node.position.x, y: node.position.y };
      selectNode(node.id);
    },
    [node.position, node.id, selectNode]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;

      updateNodePosition(node.id, {
        x: nodeStart.current.x + dx,
        y: nodeStart.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, node.id, scale, updateNodePosition]);

  const handlePortClick = (
    portId: string,
    portType: "input" | "output",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (connectingFrom) {
      if (connectingFrom.portType !== portType && connectingFrom.nodeId !== node.id) {
        completeConnection(node.id, portId);
      }
    } else {
      startConnection(node.id, portId, portType);
    }
  };

  const getStatusIcon = () => {
    switch (node.status) {
      case "running":
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
      case "completed":
        return <Check className="h-3.5 w-3.5 text-primary" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  const getNodeColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
      "text-input": "border-node-input/60 bg-card/95",
      "image-upload": "border-node-input/60 bg-card/95",
      script: "border-node-script/60 bg-card/95",
      character: "border-node-character/60 bg-card/95",
      episode: "border-node-script/60 bg-card/95",
      storyboard: "border-node-storyboard/60 bg-card/95",
      image: "border-node-image/60 bg-card/95",
      video: "border-node-video/60 bg-card/95",
      audio: "border-node-audio/60 bg-card/95",
      merge: "border-node-flow/60 bg-card/95",
      condition: "border-node-flow/60 bg-card/95",
      export: "border-node-export/60 bg-card/95",
    };
    return colors[type];
  };

  const getHeaderColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
      "text-input": "bg-node-input",
      "image-upload": "bg-node-input",
      script: "bg-node-script",
      character: "bg-node-character",
      episode: "bg-node-script",
      storyboard: "bg-node-storyboard",
      image: "bg-node-image",
      video: "bg-node-video",
      audio: "bg-node-audio",
      merge: "bg-node-flow",
      condition: "bg-node-flow",
      export: "bg-node-export",
    };
    return colors[type];
  };

  const getPortColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
      "text-input": "bg-node-input",
      "image-upload": "bg-node-input",
      script: "bg-node-script",
      character: "bg-node-character",
      episode: "bg-node-script",
      storyboard: "bg-node-storyboard",
      image: "bg-node-image",
      video: "bg-node-video",
      audio: "bg-node-audio",
      merge: "bg-node-flow",
      condition: "bg-node-flow",
      export: "bg-node-export",
    };
    return colors[type];
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "pipeline-node absolute w-64 rounded-lg border-2 shadow-xl transition-shadow select-none",
        getNodeColor(node.type),
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl",
        isDragging && "cursor-grabbing opacity-90",
        !isDragging && "cursor-grab"
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isSelected ? 100 : isDragging ? 99 : 10,
      }}
      onMouseDown={handleMouseDown}
      data-node-id={node.id}
    >
      {/* Header */}
      <div
        className={cn(
          "node-header flex items-center justify-between gap-2 rounded-t-md px-3 py-2",
          getHeaderColor(node.type)
        )}
      >
        <div className="flex items-center gap-2">
          {IconComponent && (
            <IconComponent className="h-4 w-4 text-primary-foreground" />
          )}
          <span className="text-sm font-semibold text-primary-foreground truncate">
            {node.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              toggleNodeCollapsed(node.id);
            }}
          >
            {node.isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {getStatusIcon()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-white/20"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => toggleNodeCollapsed(node.id)}>
                {node.isCollapsed ? (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    展开节点
                  </>
                ) : (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    折叠节点
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleNodeAsync(node.id)}>
                {node.isAsync ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    切换为同步
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    切换为异步
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => removeNode(node.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除节点
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className={cn(
        "node-body relative px-3 py-3 transition-all duration-200",
        node.isCollapsed ? "h-0 py-0 opacity-0 overflow-hidden" : "opacity-100"
      )}>
        {/* Input ports */}
        {node.inputs.length > 0 && (
          <div className="node-inputs mb-3 space-y-3">
            {node.inputs.map((port) => (
              <div
                key={port.id}
                className="port-row relative flex items-center gap-2 text-xs h-5"
                data-port-id={port.id}
                data-port-type="input"
              >
                <div
                  className={cn(
                    "port-handle absolute -left-[18px] h-3.5 w-3.5 rounded-full border-2 border-card transition-all cursor-pointer hover:scale-150 z-50",
                    port.connected ? getPortColor(node.type) : "bg-muted hover:bg-primary/50",
                    connectingFrom && connectingFrom.portType === "output" && "animate-pulse ring-2 ring-primary/50"
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handlePortClick(port.id, "input", e);
                  }}
                />
                <span className="text-muted-foreground ml-1">{port.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output ports */}
        {node.outputs.length > 0 && (
          <div className="node-outputs mb-3 space-y-3">
            {node.outputs.map((port) => (
              <div
                key={port.id}
                className="port-row relative flex items-center justify-end gap-2 text-xs h-5"
                data-port-id={port.id}
                data-port-type="output"
              >
                <span className="text-muted-foreground mr-1">{port.label}</span>
                <div
                  className={cn(
                    "port-handle absolute -right-[18px] h-3.5 w-3.5 rounded-full border-2 border-card transition-all cursor-pointer hover:scale-150 z-50",
                    port.connected ? getPortColor(node.type) : "bg-muted hover:bg-primary/50",
                    connectingFrom && connectingFrom.portType === "input" && "animate-pulse ring-2 ring-primary/50"
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handlePortClick(port.id, "output", e);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="my-3 border-t border-border/30" />

        {/* Async/Sync indicator */}
        <div className="mb-3 flex items-center justify-between gap-1.5 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {node.isAsync ? (
              <>
                <Zap className="h-3 w-3 text-primary" />
                <span>异步执行</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>同步执行</span>
              </>
            )}
          </div>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 font-medium",
            node.status === "idle" && "bg-muted text-muted-foreground",
            node.status === "running" && "bg-primary/20 text-primary animate-pulse",
            node.status === "completed" && "bg-primary/20 text-primary",
            node.status === "error" && "bg-destructive/20 text-destructive"
          )}>
            {node.status.toUpperCase()}
          </span>
        </div>

        {/* Node Fields */}
        <div className="custom-scrollbar max-h-[350px] overflow-y-auto rounded-md border border-border/50 bg-card p-2.5 pr-1.5 shadow-inner">
          <div className="pr-1">
            {node.status === "error" && node.data.error && (
              <div className="mb-3 rounded-md bg-destructive/10 p-2.5 border border-destructive/20 flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-destructive leading-none">执行失败</p>
                  <p className="text-[10px] text-destructive/90 leading-relaxed whitespace-pre-wrap">
                    {node.data.error as string}
                  </p>
                </div>
              </div>
            )}
            {renderNodeSpecificFields()}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { X, Zap, Clock, Upload, Wand2, Users } from "lucide-react";
import { usePipelineStore } from "@/lib/pipeline-store";
import { NODE_CONFIGS } from "@/lib/pipeline-types";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function PropertyPanel() {
  const { nodes, selectedNodeId, selectNode, updateNodeData, updateNodePorts, toggleNodeAsync } =
    usePipelineStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) return null;

  const config = NODE_CONFIGS[selectedNode.type];

  const renderNodeSpecificFields = () => {
    switch (selectedNode.type) {
      case "text-input":
        return (
          <div className="space-y-2">
            <Label htmlFor="text">文本内容</Label>
            <Textarea
              id="text"
              placeholder="输入文本内容..."
              value={(selectedNode.data.text as string) || ""}
              onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
              className="min-h-[120px] resize-none bg-input"
            />
          </div>
        );

      case "image-upload":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>上传图片</Label>
              <div className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-input hover:border-primary/50">
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    点击或拖拽上传
                  </p>
                </div>
              </div>
            </div>
            {selectedNode.data.imageUrl && (
              <div className="space-y-2">
                <Label>当前图片</Label>
                <p className="truncate text-xs text-muted-foreground">
                  {selectedNode.data.fileName as string}
                </p>
              </div>
            )}
          </div>
        );

      case "script":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="prompt">故事提示词</Label>
              <Textarea
                id="prompt"
                placeholder="描述你想要创作的故事..."
                value={(selectedNode.data.prompt as string) || ""}
                onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                className="min-h-[100px] resize-none bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scriptType">创作类型</Label>
              <Select
                value={(selectedNode.data.scriptType as string) || "short-drama"}
                onValueChange={(value) => {
                  updateNodeData(selectedNode.id, { scriptType: value });
                }}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-drama">短剧</SelectItem>
                  <SelectItem value="movie">微电影</SelectItem>
                  <SelectItem value="short-video">短视频</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedNode.data.scriptType === "short-drama" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="episodes">总集数</Label>
                  <Input
                    id="episodes"
                    type="number"
                    value={(selectedNode.data.episodes as number) || 6}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateNodeData(selectedNode.id, { episodes: value });
                    }}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episodeDuration">单集时长</Label>
                  <Select
                    value={(selectedNode.data.episodeDuration as string) || "2min"}
                    onValueChange={(value) => updateNodeData(selectedNode.id, { episodeDuration: value })}
                  >
                    <SelectTrigger className="bg-input">
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
            <div className="space-y-2">
              <Label htmlFor="genre">题材类型</Label>
              <Select
                value={(selectedNode.data.genre as string) || "drama"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { genre: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drama">剧情</SelectItem>
                  <SelectItem value="comedy">喜剧</SelectItem>
                  <SelectItem value="romance">爱情</SelectItem>
                  <SelectItem value="thriller">悬疑</SelectItem>
                  <SelectItem value="scifi">科幻</SelectItem>
                  <SelectItem value="action">动作</SelectItem>
                  <SelectItem value="horror">恐怖</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">时长</Label>
              <Select
                value={(selectedNode.data.duration as string) || "3min"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { duration: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1min">1 分钟</SelectItem>
                  <SelectItem value="3min">3 分钟</SelectItem>
                  <SelectItem value="5min">5 分钟</SelectItem>
                  <SelectItem value="10min">10 分钟</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="generatedScript">生成的剧本内容</Label>
              <Textarea
                id="generatedScript"
                placeholder="生成的剧本将显示在这里，您可以手动修改..."
                value={(selectedNode.data.generatedScript as string) || ""}
                onChange={(e) => updateNodeData(selectedNode.id, { generatedScript: e.target.value })}
                className="min-h-[200px] resize-none bg-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button 
                variant="outline"
                className="flex items-center justify-center gap-2"
                onClick={() => usePipelineStore.getState().generateCharactersFlow(selectedNode.id)}
              >
                <Users className="w-4 h-4" />
                解析角色
              </Button>
              <Button 
                className="flex items-center justify-center gap-2"
                onClick={() => usePipelineStore.getState().generateEpisodesFlow(selectedNode.id)}
              >
                <Wand2 className="w-4 h-4" />
                生成流程
              </Button>
            </div>
          </>
        );

      case "episode":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="episodeNumber">集数</Label>
              <Input
                id="episodeNumber"
                type="number"
                value={(selectedNode.data.episodeNumber as number) || 1}
                onChange={(e) => updateNodeData(selectedNode.id, { episodeNumber: parseInt(e.target.value) || 1 })}
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">本集标题</Label>
              <Input
                id="title"
                value={(selectedNode.data.title as string) || ""}
                onChange={(e) => updateNodeData(selectedNode.id, { title: e.target.value })}
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">本集剧本内容</Label>
              <Textarea
                id="content"
                placeholder="剧本内容将由前置节点传入，您也可以在此修改..."
                value={(selectedNode.data.content as string) || ""}
                onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                className="min-h-[200px] resize-none bg-input"
              />
            </div>
          </>
        );

      case "storyboard":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="sceneCount">分镜数量</Label>
              <Input
                id="sceneCount"
                type="number"
                value={(selectedNode.data.sceneCount as number) || 6}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  updateNodeData(selectedNode.id, { sceneCount: value });
                }}
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">画面比例</Label>
              <Select
                value={(selectedNode.data.aspectRatio as string) || "16:9"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { aspectRatio: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 横屏</SelectItem>
                  <SelectItem value="9:16">9:16 竖屏</SelectItem>
                  <SelectItem value="1:1">1:1 方形</SelectItem>
                  <SelectItem value="4:3">4:3 经典</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedNode.data.scenes && (selectedNode.data.scenes as any[]).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <Label className="text-xs font-bold text-accent uppercase tracking-wider">分镜内容预览</Label>
                <div className="space-y-2">
                  {(selectedNode.data.scenes as any[]).map((scene, i) => (
                    <div key={i} className="rounded-lg bg-secondary/30 p-3 border border-border/50">
                      <div className="text-[10px] font-bold text-accent mb-1 uppercase">分镜 {i + 1}</div>
                      <div className="text-xs text-foreground/90 leading-relaxed">{scene.content}</div>
                      {scene.imagePrompt && (
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <div className="text-[9px] text-muted-foreground uppercase mb-1">生图提示词</div>
                          <div className="text-[10px] text-muted-foreground italic">{scene.imagePrompt}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case "image":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="style">画风</Label>
              <Select
                value={(selectedNode.data.style as string) || "cinematic"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { style: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic">电影感</SelectItem>
                  <SelectItem value="anime">动漫</SelectItem>
                  <SelectItem value="realistic">写实</SelectItem>
                  <SelectItem value="cartoon">卡通</SelectItem>
                  <SelectItem value="watercolor">水彩</SelectItem>
                  <SelectItem value="oil-painting">油画</SelectItem>
                  <SelectItem value="3d-render">3D渲染</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">画质</Label>
              <Select
                value={(selectedNode.data.quality as string) || "high"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { quality: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿 (快速)</SelectItem>
                  <SelectItem value="standard">标准</SelectItem>
                  <SelectItem value="high">高清</SelectItem>
                  <SelectItem value="ultra">超高清</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "video":
        return (
          <>
            <div className="space-y-2">
              <Label>帧率: {selectedNode.data.fps as number} FPS</Label>
              <Slider
                value={[(selectedNode.data.fps as number) || 24]}
                onValueChange={([value]) => updateNodeData(selectedNode.id, { fps: value })}
                min={12}
                max={60}
                step={6}
                className="py-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transition">转场效果</Label>
              <Select
                value={(selectedNode.data.transition as string) || "fade"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { transition: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">淡入淡出</SelectItem>
                  <SelectItem value="dissolve">溶解</SelectItem>
                  <SelectItem value="slide">滑动</SelectItem>
                  <SelectItem value="zoom">缩放</SelectItem>
                  <SelectItem value="none">无</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "audio":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="voice">配音</Label>
              <Select
                value={(selectedNode.data.voice as string) || "narrator"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { voice: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrator">旁白 (男声)</SelectItem>
                  <SelectItem value="narrator-female">旁白 (女声)</SelectItem>
                  <SelectItem value="character-young">年轻角色</SelectItem>
                  <SelectItem value="character-old">年长角色</SelectItem>
                  <SelectItem value="dramatic">戏剧化</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>语速: {((selectedNode.data.speed as number) || 1).toFixed(1)}x</Label>
              <Slider
                value={[(selectedNode.data.speed as number) || 1]}
                onValueChange={([value]) => updateNodeData(selectedNode.id, { speed: value })}
                min={0.5}
                max={2}
                step={0.1}
                className="py-2"
              />
            </div>
          </>
        );

      case "merge":
        return (
          <div className="space-y-2">
            <Label htmlFor="mergeMode">合并模式</Label>
            <Select
              value={(selectedNode.data.mergeMode as string) || "concat"}
              onValueChange={(value) => updateNodeData(selectedNode.id, { mergeMode: value })}
            >
              <SelectTrigger className="bg-input">
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
          <div className="space-y-2">
            <Label htmlFor="condition">条件表达式</Label>
            <Input
              id="condition"
              placeholder="输入条件..."
              value={(selectedNode.data.condition as string) || ""}
              onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground">
              满足条件走"是"分支，否则走"否"分支
            </p>
          </div>
        );

      case "export":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="format">格式</Label>
              <Select
                value={(selectedNode.data.format as string) || "mp4"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { format: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">分辨率</Label>
              <Select
                value={(selectedNode.data.resolution as string) || "1080p"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { resolution: value })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p 高清</SelectItem>
                  <SelectItem value="1080p">1080p 全高清</SelectItem>
                  <SelectItem value="2k">2K</SelectItem>
                  <SelectItem value="4k">4K 超高清</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getNodeColorClass = () => {
    const colors: Record<string, string> = {
      "text-input": "bg-node-input",
      "image-upload": "bg-node-input",
      script: "bg-node-script",
      storyboard: "bg-node-storyboard",
      image: "bg-node-image",
      video: "bg-node-video",
      audio: "bg-node-audio",
      merge: "bg-node-flow",
      condition: "bg-node-flow",
      export: "bg-node-export",
    };
    return colors[selectedNode.type] || "bg-primary";
  };

  const getStatusText = () => {
    const statusMap: Record<string, string> = {
      idle: "空闲",
      running: "运行中",
      completed: "已完成",
      error: "错误",
    };
    return statusMap[selectedNode.status] || selectedNode.status;
  };

  return (
    <div className="absolute bottom-20 right-4 top-20 z-40 w-72 rounded-xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-full", getNodeColorClass())} />
          <h3 className="text-sm font-semibold text-foreground">{selectedNode.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => selectNode(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="custom-scrollbar h-[calc(100%-56px)] overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Async toggle */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
            <div className="flex items-center gap-2">
              {selectedNode.isAsync ? (
                <Zap className="h-4 w-4 text-accent" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground">
                {selectedNode.isAsync ? "异步模式" : "同步模式"}
              </span>
            </div>
            <Switch
              checked={selectedNode.isAsync}
              onCheckedChange={() => toggleNodeAsync(selectedNode.id)}
            />
          </div>

          {/* Node-specific fields */}
          {renderNodeSpecificFields()}

          {/* Status */}
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">状态</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  selectedNode.status === "idle" && "text-muted-foreground",
                  selectedNode.status === "running" && "text-primary",
                  selectedNode.status === "completed" && "text-accent",
                  selectedNode.status === "error" && "text-destructive"
                )}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

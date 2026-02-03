"use client";

import {
  Play,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Square,
  Spline,
  Minus,
  Route,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePipelineStore } from "@/lib/pipeline-store";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

export function Toolbar() {
  const { scale, setScale, setOffset, runPipeline, clearCanvas, nodes, lineStyle, setLineStyle } =
    usePipelineStore();
  const [isRunning, setIsRunning] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 确保在客户端挂载后再渲染主题相关 UI，避免 hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.25));
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 100, y: 100 });
  };

  const handleRun = async () => {
    if (nodes.length === 0 || isRunning) return;
    setIsRunning(true);
    try {
      await runPipeline();
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    // 实际实现中需要取消正在运行的任务
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border/50 bg-card/95 px-3 py-2 shadow-2xl backdrop-blur-sm">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>缩小</TooltipContent>
          </Tooltip>

          <span className="min-w-[4rem] text-center text-xs font-medium text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>放大</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleResetView}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重置视图</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Line styles */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", lineStyle === "bezier" && "bg-primary/10 text-primary")}
                onClick={() => setLineStyle("bezier")}
              >
                <Spline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>曲线连线</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", lineStyle === "straight" && "bg-primary/10 text-primary")}
                onClick={() => setLineStyle("straight")}
              >
                <Minus className="h-4 w-4 rotate-[-45deg]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>直线连线</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", lineStyle === "polyline" && "bg-primary/10 text-primary")}
                onClick={() => setLineStyle("polyline")}
              >
                <Route className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>折线连线</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Theme toggle */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {mounted && (
                      <>
                        {theme === "light" && <Sun className="h-4 w-4" />}
                        {theme === "dark" && <Moon className="h-4 w-4" />}
                        {theme === "system" && <Monitor className="h-4 w-4" />}
                        {!["light", "dark", "system"].includes(theme || "") && (
                          <Sun className="h-4 w-4" />
                        )}
                      </>
                    )}
                    {!mounted && <Sun className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>切换主题</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" className="min-w-[8rem]">
              <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                <Sun className="h-4 w-4" />
                <span>浅色</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                <Moon className="h-4 w-4" />
                <span>深色</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                <Monitor className="h-4 w-4" />
                <span>系统</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={clearCanvas}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>清空画布</TooltipContent>
          </Tooltip>

          {isRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 gap-2 px-4"
                  onClick={handleStop}
                >
                  <Square className="h-4 w-4" />
                  停止
                </Button>
              </TooltipTrigger>
              <TooltipContent>停止执行</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 gap-2 px-4"
                  onClick={handleRun}
                  disabled={nodes.length === 0}
                >
                  <Play className="h-4 w-4" />
                  运行流水线
                </Button>
              </TooltipTrigger>
              <TooltipContent>执行流水线</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Node count */}
        <Separator orientation="vertical" className="h-6" />
        <div className="text-xs text-muted-foreground">
          {nodes.length} 个节点
        </div>
      </div>
    </TooltipProvider>
  );
}

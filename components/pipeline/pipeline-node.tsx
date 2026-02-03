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
  } = usePipelineStore();

  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeStart = useRef({ x: 0, y: 0 });

  const config = NODE_CONFIGS[node.type];
  const IconComponent = ICONS[config.icon];
  const isSelected = selectedNodeId === node.id;

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
        return <Check className="h-3.5 w-3.5 text-accent" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  const getNodeColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
      "text-input": "border-node-input/60 bg-node-input/10",
      "image-upload": "border-node-input/60 bg-node-input/10",
      script: "border-node-script/60 bg-node-script/10",
      storyboard: "border-node-storyboard/60 bg-node-storyboard/10",
      image: "border-node-image/60 bg-node-image/10",
      video: "border-node-video/60 bg-node-video/10",
      audio: "border-node-audio/60 bg-node-audio/10",
      merge: "border-node-flow/60 bg-node-flow/10",
      condition: "border-node-flow/60 bg-node-flow/10",
      export: "border-node-export/60 bg-node-export/10",
    };
    return colors[type];
  };

  const getHeaderColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
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
    return colors[type];
  };

  const getPortColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
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
    return colors[type];
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "pipeline-node absolute w-56 rounded-lg border-2 shadow-xl transition-shadow select-none",
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
      <div className="node-body relative px-3 py-3">
        {/* Async/Sync indicator */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          {node.isAsync ? (
            <>
              <Zap className="h-3 w-3 text-accent" />
              <span>异步执行</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              <span>同步执行</span>
            </>
          )}
        </div>

        {/* Input ports */}
        {node.inputs.length > 0 && (
          <div className="node-inputs space-y-3">
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
          <div className="node-outputs mt-3 space-y-3">
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
      </div>
    </div>
  );
}

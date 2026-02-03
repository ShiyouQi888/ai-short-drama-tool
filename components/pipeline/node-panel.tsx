"use client";

import React from "react"

import {
  Download,
  FileText,
  ImageIcon,
  LayoutGrid,
  Mic,
  Video,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Type,
  Upload,
  GitMerge,
  GitBranch,
  Search,
  FileAudio,
  FileImage,
  Layers,
  UserCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/lib/pipeline-types";
import { NODE_CONFIGS, NODE_CATEGORIES } from "@/lib/pipeline-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  UserCircle,
};

interface NodePanelProps {
  onDragStart: (type: NodeType, e: React.DragEvent) => void;
}

export function NodePanel({ onDragStart }: NodePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    NODE_CATEGORIES.map((c) => c.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return NODE_CATEGORIES;

    return NODE_CATEGORIES.map((category) => ({
      ...category,
      nodes: category.nodes.filter((nodeType) => {
        const config = NODE_CONFIGS[nodeType];
        return config.title.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    })).filter((category) => category.nodes.length > 0);
  }, [searchQuery]);

  const getNodeColor = (type: NodeType) => {
    const config = NODE_CONFIGS[type];
    const colorMap: Record<string, string> = {
      "node-input": "bg-node-input hover:bg-node-input/80",
      "node-script": "bg-node-script hover:bg-node-script/80",
      "node-storyboard": "bg-node-storyboard hover:bg-node-storyboard/80",
      "node-image": "bg-node-image hover:bg-node-image/80",
      "node-video": "bg-node-video hover:bg-node-video/80",
      "node-audio": "bg-node-audio hover:bg-node-audio/80",
      "node-flow": "bg-node-flow hover:bg-node-flow/80",
      "node-export": "bg-node-export hover:bg-node-export/80",
    };
    return colorMap[config.color] || "bg-primary hover:bg-primary/80";
  };

  const getBorderColor = (type: NodeType) => {
    const config = NODE_CONFIGS[type];
    const colorMap: Record<string, string> = {
      "node-input": "border-node-input/50",
      "node-script": "border-node-script/50",
      "node-storyboard": "border-node-storyboard/50",
      "node-image": "border-node-image/50",
      "node-video": "border-node-video/50",
      "node-audio": "border-node-audio/50",
      "node-flow": "border-node-flow/50",
      "node-export": "border-node-export/50",
    };
    return colorMap[config.color] || "border-primary/50";
  };

  return (
    <div
      className={cn(
        "absolute left-4 top-4 z-50 flex max-h-[calc(100vh-120px)] flex-col rounded-xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "w-14" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-3">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-foreground">节点库</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="border-b border-border/50 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索节点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 bg-input pl-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Node List */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 overscroll-contain">
        {!isCollapsed ? (
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="mb-2 flex w-full items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <span>{category.name}</span>
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-transform",
                      expandedCategories.includes(category.id) && "rotate-90"
                    )}
                  />
                </button>
                {expandedCategories.includes(category.id) && (
                  <div className="space-y-1.5">
                    {category.nodes.map((nodeType) => {
                      const config = NODE_CONFIGS[nodeType];
                      const IconComponent = ICONS[config.icon];

                      return (
                        <div
                          key={nodeType}
                          draggable
                          onDragStart={(e) => onDragStart(nodeType, e)}
                          className={cn(
                            "flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all active:cursor-grabbing hover:bg-secondary/80",
                            getBorderColor(nodeType),
                            "bg-secondary/30"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                              getNodeColor(nodeType)
                            )}
                          >
                            {IconComponent && (
                              <IconComponent className="h-3.5 w-3.5 text-primary-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {config.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {config.inputs.length} 输入 / {config.outputs.length} 输出
                            </p>
                          </div>
                          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                未找到匹配的节点
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {NODE_CATEGORIES.flatMap((category) =>
              category.nodes.map((nodeType) => {
                const config = NODE_CONFIGS[nodeType];
                const IconComponent = ICONS[config.icon];

                return (
                  <div
                    key={nodeType}
                    draggable
                    onDragStart={(e) => onDragStart(nodeType, e)}
                    className={cn(
                      "flex h-8 w-8 cursor-grab items-center justify-center rounded-md transition-all active:cursor-grabbing",
                      getNodeColor(nodeType)
                    )}
                    title={config.title}
                  >
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!isCollapsed && (
        <div className="border-t border-border/50 p-3">
          <p className="text-center text-[10px] text-muted-foreground">
            拖拽节点到画布开始创建
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Save,
  Edit2,
  Check,
  X,
  Clock,
  Undo2,
  Redo2,
  ChevronDown,
  History,
  FolderPlus,
} from "lucide-react";
import { usePipelineStore } from "@/lib/pipeline-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TemplatePanel } from "./template-panel";

export function ProjectPanel() {
  const {
    currentProject,
    projects,
    history,
    historyIndex,
    createProject,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePipelineStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleRename = () => {
    if (newName.trim()) {
      renameProject(newName.trim());
      setIsRenaming(false);
      setNewName("");
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setIsNewProjectOpen(false);
      setNewProjectName("");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TooltipProvider>
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/95 p-1 shadow-xl backdrop-blur-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={undo}
                disabled={!canUndo()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>撤销</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={redo}
                disabled={!canRedo()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重做</TooltipContent>
          </Tooltip>
        </div>

        {/* History */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-border/50 bg-card/95 shadow-xl backdrop-blur-sm"
                >
                  <History className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>历史记录</TooltipContent>
          </Tooltip>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>操作历史</DialogTitle>
              <DialogDescription>
                查看和恢复之前的操作状态
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] pr-4">
              {history.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  暂无历史记录
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                        index === historyIndex
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:bg-secondary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          index === historyIndex ? "bg-primary" : "bg-muted"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {entry.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                      {index === historyIndex && (
                        <span className="text-xs text-primary">当前</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Template Library */}
        <TemplatePanel />

        {/* Project Menu */}
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/95 px-3 py-2 shadow-xl backdrop-blur-sm">
          {/* Project icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FolderOpen className="h-4 w-4 text-primary-foreground" />
          </div>

          {/* Project name */}
          <div className="min-w-0">
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-7 w-32 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") {
                      setIsRenaming(false);
                      setNewName("");
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRename}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setIsRenaming(false);
                    setNewName("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="truncate text-sm font-semibold text-foreground">
                  {currentProject?.name || "AI短剧流水线"}
                </h1>
                {currentProject && (
                  <p className="text-[10px] text-muted-foreground">
                    上次保存: {formatDate(currentProject.updatedAt)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {currentProject && !isRenaming && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={saveProject}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>保存项目</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setIsRenaming(true);
                        setNewName(currentProject.name);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>重命名</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Project dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      新建项目
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新建项目</DialogTitle>
                      <DialogDescription>
                        创建一个新的短剧流水线项目
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="项目名称"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateProject();
                        }}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsNewProjectOpen(false)}
                      >
                        取消
                      </Button>
                      <Button onClick={handleCreateProject}>创建</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {projects.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      最近项目
                    </div>
                    {projects.slice(0, 5).map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => loadProject(project.id)}
                        className="flex items-center justify-between"
                      >
                        <span className="truncate">{project.name}</span>
                        {project.id === currentProject?.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {currentProject && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteProject(currentProject.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除项目
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

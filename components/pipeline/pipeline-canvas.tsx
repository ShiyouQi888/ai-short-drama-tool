"use client";

import React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";
import type { NodeType } from "@/lib/pipeline-types";
import { PipelineNode } from "./pipeline-node";
import { ConnectionLine, ConnectionSVG, TempConnectionLine, NODE_DIMENSIONS } from "./connection-line";
import { NodePanel } from "./node-panel";
import { Toolbar } from "./toolbar";
import { PropertyPanel } from "./property-panel";
import { ProjectPanel } from "./project-panel";
import { SettingsPanel } from "./settings-panel";
import { TemplatePanel } from "./template-panel";

const { 
  NODE_WIDTH, 
  HEADER_HEIGHT, 
  BODY_PADDING_TOP, 
  ASYNC_INDICATOR_HEIGHT, 
  PORT_HEIGHT, 
  PORT_SPACING, 
  PORT_HANDLE_OFFSET 
} = NODE_DIMENSIONS;

export function PipelineCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    connections,
    scale,
    offset,
    pan,
    setScale,
    addNode,
    removeNode,
    removeConnection,
    connectingFrom,
    cancelConnection,
    selectNode,
    selectedNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePipelineStore();

  const [isPanning, setIsPanning] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace - 删除选中的节点
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        // 确保不是在输入框中
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          removeNode(selectedNodeId);
        }
      }

      // Escape - 取消连线
      if (e.key === "Escape") {
        if (connectingFrom) {
          cancelConnection();
        } else {
          selectNode(null);
        }
      }

      // Ctrl+Z - 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Ctrl+Shift+Z or Ctrl+Y - 重做
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, connectingFrom, removeNode, selectNode, cancelConnection, undo, redo, canUndo, canRedo]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(scale + delta);
    },
    [scale, setScale]
  );

  // Handle panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan with middle mouse or when clicking on canvas background
      if (e.button === 1 || (e.target === canvasRef.current && e.button === 0)) {
        if (connectingFrom) {
          cancelConnection();
          return;
        }
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...offset };
        selectNode(null);
      }
    },
    [offset, connectingFrom, cancelConnection, selectNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        pan({
          x: dx - (offset.x - offsetStart.current.x),
          y: dy - (offset.y - offsetStart.current.y),
        });
      }
    },
    [isPanning, offset, pan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle node drag and drop from panel
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("nodeType") as NodeType;
      if (!nodeType) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const x = (e.clientX - canvasRect.left - offset.x) / scale;
      const y = (e.clientY - canvasRect.top - offset.y) / scale;

      addNode(nodeType, { x, y });
    },
    [addNode, offset, scale]
  );

  const handleNodeDragStart = useCallback(
    (type: NodeType, e: React.DragEvent) => {
      e.dataTransfer.setData("nodeType", type);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  // Attach wheel listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Calculate connecting line position
  const getConnectingLineStart = () => {
    if (!connectingFrom) return null;

    const node = nodes.find((n) => n.id === connectingFrom.nodeId);
    if (!node) return null;

    if (connectingFrom.portType === "output") {
      const portIndex = node.outputs.findIndex((p) => p.id === connectingFrom.portId);
      if (portIndex === -1) return null;

      const baseY = HEADER_HEIGHT + BODY_PADDING_TOP + ASYNC_INDICATOR_HEIGHT;
      const inputsHeight = node.inputs.length > 0 
        ? node.inputs.length * PORT_HEIGHT + (node.inputs.length - 1) * PORT_SPACING + PORT_SPACING
        : 0;
      
      return {
        x: node.position.x + NODE_WIDTH + PORT_HANDLE_OFFSET,
        y: node.position.y + baseY + inputsHeight + portIndex * (PORT_HEIGHT + PORT_SPACING) + PORT_HEIGHT / 2,
      };
    } else {
      const portIndex = node.inputs.findIndex((p) => p.id === connectingFrom.portId);
      if (portIndex === -1) return null;

      const baseY = HEADER_HEIGHT + BODY_PADDING_TOP + ASYNC_INDICATOR_HEIGHT;
      
      return {
        x: node.position.x - PORT_HANDLE_OFFSET,
        y: node.position.y + baseY + portIndex * (PORT_HEIGHT + PORT_SPACING) + PORT_HEIGHT / 2,
      };
    }
  };

  const connectingStart = getConnectingLineStart();

  return (
    <div
      ref={canvasRef}
      className="relative h-screen w-full overflow-hidden bg-canvas-bg"
      style={{
        cursor: isPanning ? "grabbing" : connectingFrom ? "crosshair" : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--canvas-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--canvas-grid) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      />

      {/* Canvas content with transform */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        {/* Connections SVG layer */}
        <ConnectionSVG width={10000} height={10000}>
          {connections.map((connection) => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              nodes={nodes}
              onDelete={removeConnection}
            />
          ))}
          {/* Temporary connection line while dragging */}
          {connectingFrom && connectingStart && (
            <TempConnectionLine
              startX={connectingStart.x}
              startY={connectingStart.y}
              endX={(mousePos.x - (canvasRef.current?.getBoundingClientRect().left ?? 0) - offset.x) / scale}
              endY={(mousePos.y - (canvasRef.current?.getBoundingClientRect().top ?? 0) - offset.y) / scale}
            />
          )}
        </ConnectionSVG>

        {/* Nodes */}
        {nodes.map((node) => (
          <PipelineNode key={node.id} node={node} scale={scale} />
        ))}
      </div>

      {/* UI Overlays */}
      <NodePanel onDragStart={handleNodeDragStart} />
      <Toolbar />
      <PropertyPanel />
      <ProjectPanel />
      <SettingsPanel />
      <TemplatePanel />

      {/* Instructions overlay when empty */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 px-8 py-6 text-center backdrop-blur-sm">
            <p className="text-lg font-medium text-foreground">
              从左侧面板拖拽节点到画布开始创作
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              点击节点端口连线，构建你的AI短剧流水线
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              快捷键：Delete 删除节点 | Esc 取消操作 | Ctrl+Z 撤销 | Ctrl+Shift+Z 重做
            </p>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {selectedNodeId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="rounded-lg bg-card/90 border border-border/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            按 <kbd className="mx-1 px-1.5 py-0.5 rounded bg-muted font-mono">Delete</kbd> 删除选中节点
          </div>
        </div>
      )}
    </div>
  );
}

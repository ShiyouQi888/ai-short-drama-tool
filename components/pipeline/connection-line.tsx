"use client";

import React from "react";

import { useMemo } from "react";
import type { Connection, PipelineNode, LineStyle } from "@/lib/pipeline-types";
import { usePipelineStore } from "@/lib/pipeline-store";

// 节点尺寸常量 - 与 pipeline-node.tsx 保持一致
const NODE_WIDTH = 256; // w-64 = 16rem = 256px
const HEADER_HEIGHT = 36; // py-2 = 8px * 2 + content
const BODY_PADDING_TOP = 12; // py-3 = 12px
const PORT_HEIGHT = 20; // h-5 = 20px
const PORT_SPACING = 12; // space-y-3 = 12px
const PORT_HANDLE_OFFSET = 7; // 端口圆心到边缘

export const NODE_DIMENSIONS = {
  NODE_WIDTH,
  HEADER_HEIGHT,
  BODY_PADDING_TOP,
  PORT_HEIGHT,
  PORT_SPACING,
  PORT_HANDLE_OFFSET,
};

interface ConnectionLineProps {
  connection: Connection;
  nodes: PipelineNode[];
  onDelete: (connectionId: string) => void;
}

export function ConnectionLine({
  connection,
  nodes,
  onDelete,
}: ConnectionLineProps) {
  const sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === connection.targetNodeId);
  const lineStyle = usePipelineStore((state) => state.lineStyle);

  const pathData = useMemo(() => {
    if (!sourceNode || !targetNode) return "";

    const sourcePortIndex = sourceNode.outputs.findIndex(
      (p) => p.id === connection.sourcePortId
    );
    const targetPortIndex = targetNode.inputs.findIndex(
      (p) => p.id === connection.targetPortId
    );

    if (sourcePortIndex === -1 || targetPortIndex === -1) return "";

    // 计算输出端口位置 (在节点右侧)
    let sourceX, sourceY;
    if (sourceNode.isCollapsed) {
      sourceX = sourceNode.position.x + NODE_WIDTH + PORT_HANDLE_OFFSET;
      sourceY = sourceNode.position.y + HEADER_HEIGHT / 2;
    } else {
      const sourceBaseY = HEADER_HEIGHT + BODY_PADDING_TOP;
      // 如果有输入端口，输出端口在输入端口下面
      const inputsHeight = sourceNode.inputs.length > 0 
        ? sourceNode.inputs.length * PORT_HEIGHT + (sourceNode.inputs.length - 1) * PORT_SPACING + PORT_SPACING
        : 0;
      sourceY = sourceNode.position.y + sourceBaseY + inputsHeight + sourcePortIndex * (PORT_HEIGHT + PORT_SPACING) + PORT_HEIGHT / 2;
      sourceX = sourceNode.position.x + NODE_WIDTH + PORT_HANDLE_OFFSET;
    }

    // 计算输入端口位置 (在节点左侧)
    let targetX, targetY;
    if (targetNode.isCollapsed) {
      targetX = targetNode.position.x - PORT_HANDLE_OFFSET;
      targetY = targetNode.position.y + HEADER_HEIGHT / 2;
    } else {
      const targetBaseY = HEADER_HEIGHT + BODY_PADDING_TOP;
      targetY = targetNode.position.y + targetBaseY + targetPortIndex * (PORT_HEIGHT + PORT_SPACING) + PORT_HEIGHT / 2;
      targetX = targetNode.position.x - PORT_HANDLE_OFFSET;
    }

    if (lineStyle === "straight") {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    if (lineStyle === "polyline") {
      const offset = 30; // 端口外的缓冲距离
      
      // 如果目标在来源右侧足够远，使用 3 段式 (Z-shape)
      if (targetX >= sourceX + offset * 2) {
        const midX = sourceX + (targetX - sourceX) / 2;
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
      } 
      
      // 如果目标在来源左侧或非常接近，使用 5 段式绕行 (U-shape)
      const sX = sourceX + offset;
      const tX = targetX - offset;
      const midY = sourceY + (targetY - sourceY) / 2;
      
      // 检查 Y 轴距离，如果太近则稍微偏移一点避免重合
      const adjustedMidY = Math.abs(targetY - sourceY) < 40 ? sourceY + (targetY > sourceY ? 40 : -40) : midY;
      
      return `M ${sourceX} ${sourceY} L ${sX} ${sourceY} L ${sX} ${adjustedMidY} L ${tX} ${adjustedMidY} L ${tX} ${targetY} L ${targetX} ${targetY}`;
    }

    // 默认：创建贝塞尔曲线
    const controlPointOffset = Math.min(Math.abs(targetX - sourceX) * 0.5, 150);
    return `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`;
  }, [sourceNode, targetNode, connection.sourcePortId, connection.targetPortId, lineStyle]);

  if (!pathData) return null;

  return (
    <g className="group cursor-pointer" onClick={() => onDelete(connection.id)}>
      {/* Hit area for easier clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="pointer-events-auto"
      />
      {/* Visible line */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#connectionGradient)"
        strokeWidth={2.5}
        className="transition-all group-hover:stroke-destructive"
        strokeLinecap="round"
      />
      {/* Animated flow dots */}
      <circle r={3} fill="var(--primary)">
        <animateMotion dur="2s" repeatCount="indefinite" path={pathData} />
      </circle>
    </g>
  );
}

interface TempConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function TempConnectionLine({
  startX,
  startY,
  endX,
  endY,
}: TempConnectionLineProps) {
  const controlPointOffset = Math.min(Math.abs(endX - startX) * 0.5, 150);

  const pathData = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;

  return (
    <path
      d={pathData}
      fill="none"
      stroke="var(--primary)"
      strokeWidth={2}
      strokeDasharray="8 4"
      strokeLinecap="round"
      className="animate-pulse"
    />
  );
}

export function ConnectionSVG({
  children,
  width,
  height,
}: {
  children: React.ReactNode;
  width: number;
  height: number;
}) {
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

import type { BrushSettings, DrawingTool } from '../types/drawing';

export const drawableTools: DrawingTool[] = ['pen', 'brush', 'eraser'];

export const defaultBrushSettings: BrushSettings = {
  color: '#17201f',
  opacity: 100,
  size: 12,
  tool: 'pen',
};

export const toolLabels: Record<DrawingTool, string> = {
  brush: '브러시',
  color: '색상 선택',
  eraser: '지우개',
  fill: '채우기',
  image: '이미지 삽입',
  move: '이동',
  pen: '펜',
  select: '선택',
  text: '텍스트',
};

export const toolDescriptions: Partial<Record<DrawingTool, string>> = {
  brush: '수묵화처럼 먹 번짐, 농담, 마른 붓 가장자리가 섞인 선을 그립니다.',
  eraser: '브러시 크기만큼 기존 픽셀을 지웁니다.',
  pen: '단단하고 선명한 가장자리의 일정한 선을 그립니다.',
};

export const colorSwatches = ['#17201f', '#1f7a5b', '#e85d3f', '#f3c64e', '#1769e0', '#8b5cf6'];

export const isDrawableTool = (tool: DrawingTool) => drawableTools.includes(tool);

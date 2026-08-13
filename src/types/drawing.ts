export type DrawingTool =
  | 'select'
  | 'move'
  | 'pen'
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'text'
  | 'image'
  | 'color';

export interface CanvasSize {
  width: number;
  height: number;
}

export interface BrushSettings {
  tool: DrawingTool;
  color: string;
  size: number;
  opacity: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface StrokeRecord {
  id: string;
  brush: BrushSettings;
  startedAt: string;
  points: CanvasPoint[];
}

export interface CanvasHistoryState {
  canRedo: boolean;
  canUndo: boolean;
  hasChanges: boolean;
  redoCount: number;
  undoCount: number;
}

import { Brush, Eraser, ImagePlus, Move, MousePointer2, PaintBucket, Palette, PenLine, Type } from 'lucide-react';
import type { DrawingTool } from '../../types/drawing';

const tools = [
  { id: 'select', label: '선택', icon: MousePointer2 },
  { id: 'move', label: '이동', icon: Move },
  { id: 'pen', label: '펜', icon: PenLine },
  { id: 'brush', label: '브러시', icon: Brush },
  { id: 'eraser', label: '지우개', icon: Eraser },
  { id: 'fill', label: '채우기', icon: PaintBucket },
  { id: 'text', label: '텍스트', icon: Type },
  { id: 'image', label: '이미지 삽입', icon: ImagePlus },
  { id: 'color', label: '색상 선택', icon: Palette },
] satisfies Array<{ id: DrawingTool; label: string; icon: typeof MousePointer2 }>;

interface ToolBarPlaceholderProps {
  activeTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
}

export function ToolBarPlaceholder({ activeTool, onToolSelect }: ToolBarPlaceholderProps) {
  return (
    <aside className="tool-bar" aria-label="드로잉 도구">
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          aria-pressed={activeTool === id}
          className={activeTool === id ? 'tool-button active' : 'tool-button'}
          key={label}
          onClick={() => onToolSelect(id)}
          type="button"
          aria-label={label}
          title={label}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={2.1} />
        </button>
      ))}
    </aside>
  );
}

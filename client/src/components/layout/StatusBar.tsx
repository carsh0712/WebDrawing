import { toolLabels } from '../../constants/drawing';
import type { BrushSettings, CanvasHistoryState } from '../../types/drawing';

interface StatusBarProps {
  brush: BrushSettings;
  historyState: CanvasHistoryState;
}

export function StatusBar({ brush, historyState }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>현재 도구: {toolLabels[brush.tool]}</span>
      <span>색상: {brush.tool === 'eraser' ? '지우개' : brush.color}</span>
      <span>굵기: {brush.size}px</span>
      <span>투명도: {brush.tool === 'eraser' ? 100 : brush.opacity}%</span>
      <span>변경 상태: {historyState.hasChanges ? '변경됨' : '깨끗함'}</span>
      <span>이력: {historyState.undoCount} / 다시 실행 {historyState.redoCount}</span>
      <span>확대 비율: 100%</span>
      <span>캔버스 1440 x 960</span>
    </footer>
  );
}

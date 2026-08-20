import { colorSwatches, isDrawableTool, toolDescriptions, toolLabels } from '../../constants/drawing';
import type { BrushSettings } from '../../types/drawing';

interface PropertiesPanelPlaceholderProps {
  brush: BrushSettings;
  onBrushChange: (brush: Partial<BrushSettings>) => void;
}

export function PropertiesPanelPlaceholder({ brush, onBrushChange }: PropertiesPanelPlaceholderProps) {
  const canDraw = isDrawableTool(brush.tool);
  const selectedColor = brush.tool === 'eraser' ? '#ffffff' : brush.color;

  return (
    <section className="panel-block" aria-labelledby="properties-title">
      <h2 id="properties-title">속성</h2>
      <div className="current-tool">
        <span>현재 도구</span>
        <strong>{toolLabels[brush.tool]}</strong>
      </div>
      {toolDescriptions[brush.tool] && <p className="tool-description">{toolDescriptions[brush.tool]}</p>}
      <label>
        <span>굵기 {brush.size}px</span>
        <input
          disabled={!canDraw}
          max="80"
          min="1"
          onChange={(event) => onBrushChange({ size: Number(event.target.value) })}
          type="range"
          value={brush.size}
        />
      </label>
      <label>
        <span>투명도 {brush.opacity}%</span>
        <input
          disabled={!canDraw || brush.tool === 'eraser'}
          max="100"
          min="10"
          onChange={(event) => onBrushChange({ opacity: Number(event.target.value) })}
          type="range"
          value={brush.tool === 'eraser' ? 100 : brush.opacity}
        />
      </label>
      <label>
        <span>사용자 지정 색상</span>
        <input
          aria-label="사용자 지정 색상"
          disabled={!canDraw || brush.tool === 'eraser'}
          onChange={(event) => onBrushChange({ color: event.target.value })}
          type="color"
          value={selectedColor}
        />
      </label>
      <div className="swatches" aria-label="색상 견본">
        {colorSwatches.map((color) => (
          <button
            aria-label={`${color} 색상 선택`}
            aria-pressed={brush.color === color && brush.tool !== 'eraser'}
            className={brush.color === color && brush.tool !== 'eraser' ? 'swatch active' : 'swatch'}
            disabled={!canDraw || brush.tool === 'eraser'}
            key={color}
            onClick={() => onBrushChange({ color })}
            style={{ backgroundColor: color }}
            type="button"
          />
        ))}
      </div>
      {!canDraw && <p className="panel-hint">선택한 도구는 아직 그리기 입력을 사용하지 않습니다.</p>}
    </section>
  );
}

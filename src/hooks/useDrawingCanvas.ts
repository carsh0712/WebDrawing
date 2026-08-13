import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { isDrawableTool } from '../constants/drawing';
import type { BrushSettings, CanvasHistoryState, CanvasPoint, CanvasSize, StrokeRecord } from '../types/drawing';
import type { SavedCanvasWork } from '../types/storage';
import type { UploadedImage } from '../types/upload';

interface UseDrawingCanvasOptions {
  backgroundColor?: string;
  brush: BrushSettings;
  size: CanvasSize;
}

const createStrokeId = () => `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const calculateImagePlacement = (image: UploadedImage, canvasSize: CanvasSize) => {
  const maxWidth = canvasSize.width * 0.78;
  const maxHeight = canvasSize.height * 0.78;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  return {
    height,
    width,
    x: Math.round((canvasSize.width - width) / 2),
    y: Math.round((canvasSize.height - height) / 2),
  };
};

const hexToRgb = (hexColor: string) => {
  const normalizedColor = hexColor.replace('#', '');
  const value =
    normalizedColor.length === 3
      ? normalizedColor
          .split('')
          .map((character) => character + character)
          .join('')
      : normalizedColor;
  const numericValue = Number.parseInt(value, 16);

  return {
    b: numericValue & 255,
    g: (numericValue >> 8) & 255,
    r: (numericValue >> 16) & 255,
  };
};

const createInkNoise = (point: CanvasPoint, seed: number) => {
  const value = Math.sin(point.x * 12.9898 + point.y * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
};

const drawSumiInkStamp = (
  context: CanvasRenderingContext2D,
  point: CanvasPoint,
  color: string,
  radius: number,
  opacity: number,
  stampIndex: number,
) => {
  const rgb = hexToRgb(color);
  const wetness = Math.max(0.18, opacity);
  const coreRadius = radius * (0.32 + createInkNoise(point, stampIndex) * 0.16);
  const bleedRadius = radius * (1.38 + createInkNoise(point, stampIndex + 4) * 0.42);
  const bleedOffsetX = (createInkNoise(point, stampIndex + 1) - 0.5) * radius * 0.36;
  const bleedOffsetY = (createInkNoise(point, stampIndex + 2) - 0.5) * radius * 0.36;
  const bleed = context.createRadialGradient(
    point.x + bleedOffsetX,
    point.y + bleedOffsetY,
    radius * 0.05,
    point.x + bleedOffsetX,
    point.y + bleedOffsetY,
    bleedRadius,
  );

  bleed.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${wetness * 0.3})`);
  bleed.addColorStop(0.58, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${wetness * 0.12})`);
  bleed.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
  context.fillStyle = bleed;
  context.beginPath();
  context.arc(point.x + bleedOffsetX, point.y + bleedOffsetY, bleedRadius, 0, Math.PI * 2);
  context.fill();

  const core = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);

  core.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, wetness * 1.05)})`);
  core.addColorStop(0.34, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${wetness * 0.72})`);
  core.addColorStop(0.72, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${wetness * 0.28})`);
  core.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
  context.fillStyle = core;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();

  for (let bristle = 0; bristle < 5; bristle += 1) {
    const angle = createInkNoise(point, stampIndex + bristle + 8) * Math.PI * 2;
    const distance = radius * (0.18 + createInkNoise(point, stampIndex + bristle + 13) * 0.72);
    const bristleRadius = Math.max(1.2, coreRadius * (0.08 + createInkNoise(point, stampIndex + bristle + 21) * 0.18));
    const x = point.x + Math.cos(angle) * distance;
    const y = point.y + Math.sin(angle) * distance;

    context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${wetness * 0.42})`;
    context.beginPath();
    context.ellipse(x, y, bristleRadius * 2.8, bristleRadius, angle, 0, Math.PI * 2);
    context.fill();
  }
};

export function useDrawingCanvas({ backgroundColor = '#ffffff', brush, size }: UseDrawingCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const lastPointRef = useRef<CanvasPoint | null>(null);
  const currentStrokeRef = useRef<StrokeRecord | null>(null);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const currentSnapshotRef = useRef<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [historyState, setHistoryState] = useState<CanvasHistoryState>({
    canRedo: false,
    canUndo: false,
    hasChanges: false,
    redoCount: 0,
    undoCount: 0,
  });

  const fillCanvasBackground = useCallback(
    (context: CanvasRenderingContext2D) => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      context.restore();
    },
    [backgroundColor],
  );

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canRedo: redoStackRef.current.length > 0,
      canUndo: undoStackRef.current.length > 1,
      hasChanges: undoStackRef.current.length > 1,
      redoCount: redoStackRef.current.length,
      undoCount: Math.max(undoStackRef.current.length - 1, 0),
    });
  }, []);

  const captureSnapshot = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return '';
    }

    return canvas.toDataURL('image/png');
  }, []);

  const createThumbnail = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return '';
    }

    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailWidth = 320;
    const thumbnailHeight = Math.round((thumbnailWidth / size.width) * size.height);
    const thumbnailContext = thumbnailCanvas.getContext('2d');

    if (!thumbnailContext) {
      return '';
    }

    thumbnailCanvas.width = thumbnailWidth;
    thumbnailCanvas.height = thumbnailHeight;
    thumbnailContext.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);

    return thumbnailCanvas.toDataURL('image/png');
  }, [size.height, size.width]);

  const renderSnapshot = useCallback(
    (snapshot: string) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (!canvas || !context) {
        return;
      }

      const image = new Image();
      image.onload = () => {
        context.save();
        context.clearRect(0, 0, size.width, size.height);
        context.drawImage(image, 0, 0, size.width, size.height);
        context.restore();
      };
      image.src = snapshot;
    },
    [size.height, size.width],
  );

  const commitSnapshot = useCallback(() => {
    const snapshot = captureSnapshot();

    if (!snapshot || snapshot === currentSnapshotRef.current) {
      return;
    }

    undoStackRef.current.push(snapshot);
    redoStackRef.current = [];
    currentSnapshotRef.current = snapshot;
    syncHistoryState();
  }, [captureSnapshot, syncHistoryState]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    canvas.style.aspectRatio = `${size.width} / ${size.height}`;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    fillCanvasBackground(context);

    const initialSnapshot = canvas.toDataURL('image/png');
    currentSnapshotRef.current = initialSnapshot;
    undoStackRef.current = [initialSnapshot];
    redoStackRef.current = [];
    initializedRef.current = true;
    syncHistoryState();
  }, [fillCanvasBackground, size.height, size.width, syncHistoryState]);

  const getCanvasPoint = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): CanvasPoint => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = size.width / rect.width;
      const scaleY = size.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    },
    [size.height, size.width],
  );

  const drawSegment = useCallback(
    (from: CanvasPoint, to: CanvasPoint) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (!context) {
        return;
      }

      context.save();
      context.globalAlpha = brush.opacity / 100;
      context.globalCompositeOperation = brush.tool === 'eraser' ? 'destination-out' : 'source-over';

      if (brush.tool === 'brush') {
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const radius = Math.max(1, brush.size / 2);
        const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.34)));

        context.globalAlpha = 1;

        for (let step = 0; step <= steps; step += 1) {
          const progress = step / steps;
          const wave = Math.sin(progress * Math.PI * 4 + from.x * 0.01 + from.y * 0.01);
          const jitter = radius * 0.08;
          drawSumiInkStamp(
            context,
            {
              x: from.x + (to.x - from.x) * progress + wave * jitter,
              y: from.y + (to.y - from.y) * progress - wave * jitter * 0.55,
            },
            brush.color,
            radius * (0.92 + createInkNoise(from, step) * 0.3),
            brush.opacity / 100,
            step,
          );
        }

        context.restore();
        return;
      }

      context.strokeStyle = brush.color;
      context.lineWidth = brush.size;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      context.restore();
    },
    [brush.color, brush.opacity, brush.size, brush.tool],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (event.button !== 0 && event.pointerType === 'mouse') {
        return;
      }

      if (!isDrawableTool(brush.tool)) {
        return;
      }

      event.preventDefault();
      const canvas = canvasRef.current;
      const point = getCanvasPoint(event);

      canvas?.setPointerCapture(event.pointerId);
      activePointerIdRef.current = event.pointerId;
      lastPointRef.current = point;
      currentStrokeRef.current = {
        id: createStrokeId(),
        brush,
        points: [point],
        startedAt: new Date().toISOString(),
      };
      setIsDrawing(true);

      drawSegment(point, { x: point.x + 0.01, y: point.y + 0.01 });
    },
    [brush, drawSegment, getCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const lastPoint = lastPointRef.current;

      if (!lastPoint) {
        return;
      }

      const nextPoint = getCanvasPoint(event);
      drawSegment(lastPoint, nextPoint);
      currentStrokeRef.current?.points.push(nextPoint);
      lastPointRef.current = nextPoint;
    },
    [drawSegment, getCanvasPoint],
  );

  const finishStroke = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const canvas = canvasRef.current;

      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      activePointerIdRef.current = null;
      lastPointRef.current = null;

      if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
        setStrokeCount((count) => count + 1);
        commitSnapshot();
      }

      currentStrokeRef.current = null;
      setIsDrawing(false);
    },
    [commitSnapshot],
  );

  const undo = useCallback(() => {
    if (undoStackRef.current.length <= 1) {
      return;
    }

    const currentSnapshot = undoStackRef.current.pop();

    if (currentSnapshot) {
      redoStackRef.current.push(currentSnapshot);
    }

    const previousSnapshot = undoStackRef.current.at(-1);

    if (previousSnapshot) {
      currentSnapshotRef.current = previousSnapshot;
      renderSnapshot(previousSnapshot);
    }

    syncHistoryState();
  }, [renderSnapshot, syncHistoryState]);

  const redo = useCallback(() => {
    const nextSnapshot = redoStackRef.current.pop();

    if (!nextSnapshot) {
      return;
    }

    undoStackRef.current.push(nextSnapshot);
    currentSnapshotRef.current = nextSnapshot;
    renderSnapshot(nextSnapshot);
    syncHistoryState();
  }, [renderSnapshot, syncHistoryState]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!context) {
      return;
    }

    fillCanvasBackground(context);
    commitSnapshot();
  }, [commitSnapshot, fillCanvasBackground]);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    fillCanvasBackground(context);

    const initialSnapshot = canvas.toDataURL('image/png');
    undoStackRef.current = [initialSnapshot];
    redoStackRef.current = [];
    currentSnapshotRef.current = initialSnapshot;
    setStrokeCount(0);
    syncHistoryState();
  }, [fillCanvasBackground, syncHistoryState]);

  const loadImageDataUrl = useCallback(
    (imageDataUrl: string) =>
      new Promise<void>((resolve, reject) => {
        const canvas = canvasRef.current;

        if (!canvas) {
          reject(new Error('캔버스를 사용할 수 없습니다.'));
          return;
        }

        const image = new Image();
        image.onload = () => {
          const context = canvas.getContext('2d');

          if (!context) {
            reject(new Error('캔버스 컨텍스트를 사용할 수 없습니다.'));
            return;
          }

          context.save();
          context.clearRect(0, 0, size.width, size.height);
          context.drawImage(image, 0, 0, size.width, size.height);
          context.restore();

          const loadedSnapshot = canvas.toDataURL('image/png');
          undoStackRef.current = [loadedSnapshot];
          redoStackRef.current = [];
          currentSnapshotRef.current = loadedSnapshot;
          setStrokeCount(0);
          syncHistoryState();
          resolve();
        };
        image.onerror = () => reject(new Error('저장된 작업을 불러올 수 없습니다.'));
        image.src = imageDataUrl;
      }),
    [size.height, size.width, syncHistoryState],
  );

  const loadSavedWork = useCallback(
    (savedWork: SavedCanvasWork) => loadImageDataUrl(savedWork.imageDataUrl),
    [loadImageDataUrl],
  );

  const placeImage = useCallback(
    (uploadedImage: UploadedImage) =>
      new Promise<void>((resolve, reject) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) {
          reject(new Error('캔버스를 사용할 수 없습니다.'));
          return;
        }

        const image = new Image();
        image.onload = () => {
          const placement = calculateImagePlacement(uploadedImage, size);

          context.save();
          context.globalAlpha = 1;
          context.globalCompositeOperation = 'source-over';
          context.drawImage(image, placement.x, placement.y, placement.width, placement.height);
          context.restore();

          setStrokeCount((count) => count + 1);
          commitSnapshot();
          resolve();
        };
        image.onerror = () => reject(new Error('선택한 이미지를 캔버스에 배치할 수 없습니다.'));
        image.src = uploadedImage.objectUrl;
      }),
    [commitSnapshot, size],
  );

  return {
    canvasRef,
    clearCanvas,
    createThumbnail,
    exportImageDataUrl: captureSnapshot,
    handlePointerCancel: finishStroke,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishStroke,
    historyState,
    isDrawing,
    loadSavedWork,
    placeImage,
    redo,
    resetCanvas,
    strokeCount,
    undo,
  };
}

export interface CanvasSizeDto {
  width: number;
  height: number;
}

export interface DrawingSummaryDto {
  canvasSize: CanvasSizeDto;
  createdAt: string;
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
}

export interface DrawingDetailDto extends DrawingSummaryDto {
  imageUrl: string | null;
  projectData: Record<string, unknown>;
}

export interface SaveDrawingRequestDto {
  canvasSize: CanvasSizeDto;
  imageDataUrl: string;
  name: string;
  projectData?: Record<string, unknown>;
  thumbnailDataUrl: string;
}

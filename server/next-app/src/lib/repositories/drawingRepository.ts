import type { SupabaseClient } from '@supabase/supabase-js';
import { getPostgresPool } from '@/lib/database/postgres';
import { runtimeEnvironment } from '@/lib/runtime/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DrawingDetailDto, DrawingSummaryDto, SaveDrawingRequestDto } from '@/types/drawing';

const developmentUser = {
  email: 'developer@webdrawing.local',
  id: '00000000-0000-4000-8000-000000000001',
};

const getServerUserId = () => process.env.APP_SERVICE_USER_ID || developmentUser.id;

interface DrawingProjectRow {
  canvas_height: number;
  canvas_width: number;
  created_at: string;
  id: string;
  image_path: string | null;
  project_data: Record<string, unknown>;
  thumbnail_path: string | null;
  title: string;
  updated_at: string;
  user_id: string;
}

export interface CreateUploadInput {
  byteSize: number;
  fileName: string;
  mimeType: string;
  projectId?: string | null;
  storagePath: string;
}

export interface UploadDto {
  createdAt: string;
  fileName: string;
  fileUrl: string | null;
  id: string;
  mimeType: string;
}

const toSummaryDto = (row: DrawingProjectRow): DrawingSummaryDto => ({
  canvasSize: {
    height: row.canvas_height,
    width: row.canvas_width,
  },
  createdAt: row.created_at,
  id: row.id,
  name: row.title,
  thumbnailUrl: row.thumbnail_path,
  updatedAt: row.updated_at,
});

const toDetailDto = (row: DrawingProjectRow): DrawingDetailDto => ({
  ...toSummaryDto(row),
  imageUrl: row.image_path,
  projectData: row.project_data || {},
});

const ensureDevelopmentUser = async () => {
  const pool = getPostgresPool();

  await pool.query(
    `
      insert into auth.users (id, email)
      values ($1, $2)
      on conflict (id) do update
      set email = excluded.email
    `,
    [developmentUser.id, developmentUser.email],
  );
  await pool.query(
    `
      insert into public.profiles (id, email, display_name)
      values ($1, $2, $3)
      on conflict (id) do update
      set email = excluded.email,
          display_name = excluded.display_name,
          updated_at = now()
    `,
    [developmentUser.id, developmentUser.email, 'Developer'],
  );

  return developmentUser.id;
};

const validateCanvasSize = (input: SaveDrawingRequestDto) => {
  const width = input.canvasSize?.width;
  const height = input.canvasSize?.height;

  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
};

class PostgresDrawingRepository {
  async listDrawings() {
    const userId = await ensureDevelopmentUser();
    const result = await getPostgresPool().query<DrawingProjectRow>(
      `
        select *
        from public.drawing_projects
        where user_id = $1
        order by updated_at desc
      `,
      [userId],
    );

    return result.rows.map(toSummaryDto);
  }

  async createDrawing(input: SaveDrawingRequestDto) {
    const userId = await ensureDevelopmentUser();
    const result = await getPostgresPool().query<DrawingProjectRow>(
      `
        insert into public.drawing_projects (
          user_id,
          title,
          canvas_width,
          canvas_height,
          project_data,
          image_path,
          thumbnail_path
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
      `,
      [
        userId,
        input.name.trim() || '제목 없는 작업',
        input.canvasSize.width,
        input.canvasSize.height,
        input.projectData || {},
        input.imageDataUrl,
        input.thumbnailDataUrl,
      ],
    );

    return toDetailDto(result.rows[0]);
  }

  async getDrawing(drawingId: string) {
    const userId = await ensureDevelopmentUser();
    const result = await getPostgresPool().query<DrawingProjectRow>(
      `
        select *
        from public.drawing_projects
        where id = $1 and user_id = $2
      `,
      [drawingId, userId],
    );

    return result.rows[0] ? toDetailDto(result.rows[0]) : null;
  }

  async updateDrawing(drawingId: string, input: SaveDrawingRequestDto) {
    const userId = await ensureDevelopmentUser();
    const result = await getPostgresPool().query<DrawingProjectRow>(
      `
        update public.drawing_projects
        set title = $3,
            canvas_width = $4,
            canvas_height = $5,
            project_data = $6,
            image_path = $7,
            thumbnail_path = $8,
            updated_at = now()
        where id = $1 and user_id = $2
        returning *
      `,
      [
        drawingId,
        userId,
        input.name.trim() || '제목 없는 작업',
        input.canvasSize.width,
        input.canvasSize.height,
        input.projectData || {},
        input.imageDataUrl,
        input.thumbnailDataUrl,
      ],
    );

    return result.rows[0] ? toDetailDto(result.rows[0]) : null;
  }

  async deleteDrawing(drawingId: string) {
    const userId = await ensureDevelopmentUser();
    const result = await getPostgresPool().query(
      `
        delete from public.drawing_projects
        where id = $1 and user_id = $2
      `,
      [drawingId, userId],
    );

    return (result.rowCount || 0) > 0;
  }

  async createUpload(input: CreateUploadInput): Promise<UploadDto> {
    const userId = await ensureDevelopmentUser();
    const result = await getPostgresPool().query<{
      created_at: string;
      file_name: string;
      id: string;
      mime_type: string;
      storage_path: string;
    }>(
      `
        insert into public.uploaded_images (
          user_id,
          project_id,
          storage_path,
          file_name,
          mime_type,
          byte_size
        )
        values ($1, $2, $3, $4, $5, $6)
        returning id, storage_path, file_name, mime_type, created_at
      `,
      [userId, input.projectId || null, input.storagePath, input.fileName, input.mimeType, input.byteSize],
    );
    const row = result.rows[0];

    return {
      createdAt: row.created_at,
      fileName: row.file_name,
      fileUrl: row.storage_path,
      id: row.id,
      mimeType: row.mime_type,
    };
  }
}

class SupabaseDrawingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listDrawings() {
    const { data, error } = await this.supabase
      .from('drawing_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as DrawingProjectRow[]).map(toSummaryDto);
  }

  async createDrawing(input: SaveDrawingRequestDto) {
    const { data, error } = await this.supabase
      .from('drawing_projects')
      .insert({
        canvas_height: input.canvasSize.height,
        canvas_width: input.canvasSize.width,
        image_path: input.imageDataUrl,
        project_data: input.projectData || {},
        thumbnail_path: input.thumbnailDataUrl,
        title: input.name.trim() || '제목 없는 작업',
        user_id: getServerUserId(),
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDetailDto(data as DrawingProjectRow);
  }

  async getDrawing(drawingId: string) {
    const { data, error } = await this.supabase.from('drawing_projects').select('*').eq('id', drawingId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDetailDto(data as DrawingProjectRow) : null;
  }

  async updateDrawing(drawingId: string, input: SaveDrawingRequestDto) {
    const { data, error } = await this.supabase
      .from('drawing_projects')
      .update({
        canvas_height: input.canvasSize.height,
        canvas_width: input.canvasSize.width,
        image_path: input.imageDataUrl,
        project_data: input.projectData || {},
        thumbnail_path: input.thumbnailDataUrl,
        title: input.name.trim() || '제목 없는 작업',
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawingId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDetailDto(data as DrawingProjectRow) : null;
  }

  async deleteDrawing(drawingId: string) {
    const { error } = await this.supabase.from('drawing_projects').delete().eq('id', drawingId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  async createUpload(input: CreateUploadInput): Promise<UploadDto> {
    const { data, error } = await this.supabase
      .from('uploaded_images')
      .insert({
        byte_size: input.byteSize,
        file_name: input.fileName,
        mime_type: input.mimeType,
        project_id: input.projectId || null,
        storage_path: input.storagePath,
        user_id: getServerUserId(),
      })
      .select('id, storage_path, file_name, mime_type, created_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      createdAt: data.created_at,
      fileName: data.file_name,
      fileUrl: data.storage_path,
      id: data.id,
      mimeType: data.mime_type,
    };
  }
}

export const isValidSaveDrawingInput = (input: SaveDrawingRequestDto | null): input is SaveDrawingRequestDto =>
  Boolean(input?.name !== undefined && input?.imageDataUrl && input?.thumbnailDataUrl && validateCanvasSize(input));

export const createDrawingRepository = () => {
  if (runtimeEnvironment.databaseProvider === 'supabase') {
    return new SupabaseDrawingRepository(createSupabaseServerClient());
  }

  return new PostgresDrawingRepository();
};

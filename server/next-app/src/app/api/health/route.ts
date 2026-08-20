import { jsonData, optionsResponse } from '@/lib/http';
import { hasDockerDatabaseConfig, runtimeEnvironment } from '@/lib/runtime/environment';
import { hasSupabaseServerConfig } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return jsonData({
    ok: true,
    service: 'web-drawing-canvas-api',
    appEnv: runtimeEnvironment.appEnv,
    databaseProvider: runtimeEnvironment.databaseProvider,
    dockerDatabaseConfigured: hasDockerDatabaseConfig,
    supabaseConfigured: hasSupabaseServerConfig,
  });
}

import { runtimeEnvironment } from '@/lib/runtime/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const developmentUserId = '00000000-0000-4000-8000-000000000001';

export class ApiAuthError extends Error {
  constructor(message = '인증이 필요합니다.') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export interface ApiUserContext {
  accessToken?: string;
  userId: string;
}

const readBearerToken = (request: Request) => {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
};

export const requireApiUser = async (request: Request): Promise<ApiUserContext> => {
  if (runtimeEnvironment.databaseProvider !== 'supabase') {
    return {
      userId: process.env.APP_SERVICE_USER_ID || developmentUserId,
    };
  }

  const accessToken = readBearerToken(request);

  if (!accessToken) {
    throw new ApiAuthError();
  }

  const {
    data: { user },
    error,
  } = await createSupabaseServerClient().auth.getUser(accessToken);

  if (error || !user) {
    throw new ApiAuthError('유효하지 않은 인증 토큰입니다.');
  }

  return {
    accessToken,
    userId: user.id,
  };
};

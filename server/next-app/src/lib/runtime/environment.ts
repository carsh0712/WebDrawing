export type AppEnvironment = 'development' | 'production' | 'test';
export type DatabaseProvider = 'docker-postgres' | 'supabase';

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development') as AppEnvironment;
const databaseProvider = (process.env.DATABASE_PROVIDER || 'docker-postgres') as DatabaseProvider;

export const runtimeEnvironment = {
  appEnv,
  databaseProvider,
  isDevelopment: appEnv === 'development',
  isProduction: appEnv === 'production',
};

export const defaultDevelopmentDatabaseUrl =
  'postgres://webdrawing:webdrawing_dev_password@localhost:54322/webdrawing_dev';

export const getDatabaseUrl = () => process.env.DATABASE_URL || defaultDevelopmentDatabaseUrl;

export const hasDockerDatabaseConfig = Boolean(getDatabaseUrl());

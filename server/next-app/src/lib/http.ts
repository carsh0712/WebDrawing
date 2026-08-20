import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const withCorsHeaders = (init?: ResponseInit): ResponseInit => ({
  ...init,
  headers: {
    ...corsHeaders,
    ...init?.headers,
  },
});

export const jsonData = <TData>(data: TData, init?: ResponseInit) => NextResponse.json({ data }, withCorsHeaders(init));

export const jsonError = (code: string, message: string, status = 400) =>
  NextResponse.json<ApiErrorBody>(
    {
      error: {
        code,
        message,
      },
    },
    withCorsHeaders({ status }),
  );

export const optionsResponse = () => new Response(null, { headers: corsHeaders, status: 204 });

import axios, { isAxiosError } from 'axios';
import { getStoredAccessToken, isAuthEnabled } from '@/lib/auth';

export type ApiClientRequestParams<TBody> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: TBody;
};

export type ApiClientBlobRequestParams = {
  method: 'GET' | 'POST';
  path: string;
};

type ApiErrorResponse = {
  errors?: string[];
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APIGW_URL ?? import.meta.env.VITE_API_ENDPOINT,
});

const appendAuthHeaderIfNeeded = (headers: Record<string, string>) => {
  if (!isAuthEnabled()) return;
  const token = getStoredAccessToken();
  if (!token) return;
  headers.Authorization = `Bearer ${token}`;
};

export async function apiRequest<TResponse, TBody = undefined>(
  params: ApiClientRequestParams<TBody>
): Promise<TResponse> {
  const headers: Record<string, string> = {};
  // GET等で不要な Content-Type を付けるとブラウザが preflight(OPTIONS) を発行しやすくなる。
  // API 側の互換性/安定性のため、JSON body を送る場合のみ明示する。
  if (params.body !== undefined && !(params.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  appendAuthHeaderIfNeeded(headers);

  const response = await axiosInstance.request<TResponse>({
    method: params.method,
    url: params.path,
    data: params.body,
    headers,
  });

  if (response.status === 204) {
    return undefined as unknown as TResponse;
  }

  return response.data;
}

export async function apiRequestBlob(params: ApiClientBlobRequestParams): Promise<Blob> {
  const headers: Record<string, string> = {};
  appendAuthHeaderIfNeeded(headers);
  const response = await axiosInstance.request<Blob>({
    method: params.method,
    url: params.path,
    headers,
    responseType: 'blob',
  });

  return response.data;
}

export function getApiErrorCodes(error: unknown): string[] {
  if (!isAxiosError<ApiErrorResponse>(error)) return [];
  return error.response?.data?.errors ?? [];
}

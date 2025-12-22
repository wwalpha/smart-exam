import axios from 'axios';

export type ApiClientRequestParams<TBody> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: TBody;
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT,
});

export async function apiRequest<TResponse, TBody = undefined>(
  params: ApiClientRequestParams<TBody>
): Promise<TResponse> {
  const headers: Record<string, string> = {};
  if (!(params.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

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

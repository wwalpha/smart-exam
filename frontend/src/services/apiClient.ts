import axios from 'axios'

export type ApiClientRequestParams<TBody> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: TBody
}

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function apiRequest<TResponse, TBody = undefined>(
  params: ApiClientRequestParams<TBody>,
): Promise<TResponse> {
  const response = await axiosInstance.request<TResponse>({
    method: params.method,
    url: params.path,
    data: params.body,
  })

  return response.data
}

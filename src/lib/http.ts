// HTTP primitives — imported by all service files
import { authStore } from '@/lib/auth-store'

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
  get isUnauthorized() { return this.status === 401 }
  get isNotFound()     { return this.status === 404 }
}

export async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = false, headers: extraHeaders, ...rest } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string> | undefined ?? {}),
  }
  if (auth) {
    const bearer = authStore.bearerHeader()
    if (bearer) headers['Authorization'] = bearer
  }
  const res = await fetch(`${BASE}${path}`, { ...rest, headers })
  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = await res.json()
      msg = Array.isArray(body.message) ? body.message[0] : body.message ?? msg
    } catch { /* ignore */ }
    throw new ApiError(res.status, msg)
  }
  if (res.status === 204) return undefined as unknown as T

  const json = await res.json()

  // TransformInterceptor bọc response: { data: T }
  // Ngoại lệ: list responses đã có key "data" (ArtworkListResponse {data,total,page})
  // → interceptor pass-through → FE nhận nguyên {data,total,page}
  // Với các response khác (user, pnl, ohlcv array...) → interceptor bọc → { data: T }
  // → cần unwrap về T
  if (
    json !== null &&
    typeof json === 'object' &&
    'data' in json &&
    !('total' in json) &&   // list response có total → không unwrap
    !('candles' in json)    // ohlcv response shape
  ) {
    return json.data as T
  }

  return json as T
}

export const get  = <T>(path: string, auth = false)               => request<T>(path, { method: 'GET', auth })
export const post = <T>(path: string, body: unknown, auth = false) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body), auth })

export async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const bearer = authStore.bearerHeader()
  const headers: Record<string, string> = {}
  if (bearer) headers['Authorization'] = bearer
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData })
  if (!res.ok) {
    let msg = res.statusText
    try { const b = await res.json(); msg = Array.isArray(b.message) ? b.message[0] : b.message ?? msg } catch { /* ignore */ }
    throw new ApiError(res.status, msg)
  }
  return res.json() as Promise<T>
}

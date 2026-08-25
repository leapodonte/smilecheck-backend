import axios from 'axios'
import { message } from 'ant-design-vue'
import { signRequestBody, nowTimestamp } from '../utils/sign'
import i18n from '../locales'

/**
 * 会话在 localStorage 的键
 */
export const SESSION_KEY = 'admin_session'

/**
 * API 服务地址（直连，跨域响应头由 API 的 HttpHeaders 中间件处理）
 */
export const API_ORIGIN = 'http://localhost:5000'

/**
 * 后台管理接口地址前缀
 */
export const API_BASE = `${API_ORIGIN}/admin`

/**
 * 补全服务端返回的相对路径（如 /storage/...）为完整 URL
 */
export function resolveUrl(url?: string | null): string {
  if (!url)
    return ''
  if (/^https?:\/\//.test(url))
    return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * 统一响应包裹结构
 */
export interface ApiResponse<T = unknown> {
  code: number
  msg?: string | null
  data?: T
}

const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

//JSON 请求：序列化后按 body+timestamp 计算签名
http.interceptors.request.use((config) => {
  if (config.data !== undefined && !(config.data instanceof FormData)) {
    const body = JSON.stringify(config.data)
    config.data = body
    config.headers['Content-Type'] = 'application/json'
    const ts = nowTimestamp()
    config.headers['Admin-Timestamp'] = String(ts)
    config.headers['Admin-Signature'] = signRequestBody(body, ts)
  }
  const session = localStorage.getItem(SESSION_KEY)
  if (session) {
    config.headers['Admin-Session'] = session
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (!res || typeof res.code !== 'number') {
      return response
    }
    if (res.code !== 0) {
      if (res.code === 401) {
        //会话失效：清理并跳登录页
        localStorage.removeItem(SESSION_KEY)
        if (!location.pathname.startsWith('/login')) {
          message.error(res.msg || i18n.global.t('common.sessionExpired'))
          setTimeout(() => {
            location.href = '/login'
          }, 500)
        }
      } else {
        message.error(res.msg || `Error ${res.code}`)
      }
      return Promise.reject(new Error(res.msg || `Error ${res.code}`))
    }
    //直接返回 data 部分，简化调用方
    return res.data as never
  },
  (error) => {
    message.error(i18n.global.t('common.networkError'))
    return Promise.reject(error)
  },
)

export default http

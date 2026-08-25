import CryptoJS from 'crypto-js'

/**
 * 请求签名密钥（与服务端 EncryptorService.RequestKey 一致）
 */
const REQUEST_KEY = '883F5AB8-F432-4A46-A938-BE620BC59703'

/**
 * 客户端密码签名密钥（与服务端 EncryptorService.ClientPwdKey 一致）
 */
const CLIENT_PWD_KEY = '3F4A8D0F-602D-47B1-8180-76246DAAC4A1'

/**
 * HMAC-SHA256 签名（hex 小写，与服务端一致）
 */
export function hmacSha256(message: string, key: string): string {
  return CryptoJS.HmacSHA256(message, key).toString(CryptoJS.enc.Hex)
}

/**
 * 计算请求签名：Sign(body + timestamp)
 */
export function signRequestBody(body: string, timestamp: number): string {
  return hmacSha256(`${body}${timestamp}`, REQUEST_KEY)
}

/**
 * 客户端侧密码签名（登录/改密前对明文密码签名）
 */
export function signPassword(password: string): string {
  return hmacSha256(password, CLIENT_PWD_KEY)
}

/**
 * 当前 unix 秒级时间戳
 */
export function nowTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

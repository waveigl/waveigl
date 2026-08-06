export interface ParsedUserAgent {
  deviceType: string
  os: string
  browser: string
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase()

  let deviceType = 'desktop'
  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet'
  } else if (/mobi|ip(hone|od)|android.*mobile|blackberry|windows phone|opera mini/i.test(ua)) {
    deviceType = 'mobile'
  }

  let os = 'Desconhecido'
  if (/windows nt/.test(ua)) os = 'Windows'
  else if (/android/.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/.test(ua)) os = 'iOS'
  else if (/mac os x|macintosh/.test(ua)) os = 'macOS'
  else if (/linux/.test(ua)) os = 'Linux'

  let browser = 'Desconhecido'
  if (/edg(?:e|ios|a)?\//.test(ua)) browser = 'Edge'
  else if (/opr\/|opera/.test(ua)) browser = 'Opera'
  else if (/chrome|crios|crmo/.test(ua)) browser = 'Chrome'
  else if (/firefox|fxios/.test(ua)) browser = 'Firefox'
  else if (/safari/.test(ua)) browser = 'Safari'
  else if (/msie|trident/.test(ua)) browser = 'Internet Explorer'

  return { deviceType, os, browser }
}

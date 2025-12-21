'use client'

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /(FBAN|FBAV|Instagram|GSA|Line|WeChat|Weibo|Twitter|VK|Snapchat)/i.test(ua)
}

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

export function openInSystemBrowser() {
  try {
    const url = window.location.href
    // Best-effort: open current URL in a new top-level tab (lets user choose default browser)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {}
}



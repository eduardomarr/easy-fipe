declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

window.dataLayer = window.dataLayer || []

function gtag(...args: unknown[]) {
  window.dataLayer.push(args)
}

window.gtag = gtag

gtag('js', new Date())
gtag('config', 'G-CKKPNV8CBZ')

export function trackEvent(name: string, params?: Record<string, string>) {
  gtag('event', name, params)
}

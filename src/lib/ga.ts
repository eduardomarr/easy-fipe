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
gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID)

export function trackEvent(name: string, params?: Record<string, string>) {
  gtag('event', name, params)
}

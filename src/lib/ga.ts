declare global {
  interface Window {
    dataLayer: IArguments[]
    gtag: (...args: unknown[]) => void
  }
}

window.dataLayer = window.dataLayer || []

// Must use `arguments` (not rest params) — gtag.js reads each entry as an Arguments object
// eslint-disable-next-line prefer-rest-params
function gtag() { window.dataLayer.push(arguments as unknown as IArguments) }

window.gtag = gtag as Window['gtag']

const g = window.gtag
g('js', new Date())
g('config', import.meta.env.VITE_GA_MEASUREMENT_ID)

export function trackEvent(name: string, params?: Record<string, string>) {
  g('event', name, params)
}

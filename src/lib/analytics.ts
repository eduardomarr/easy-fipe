import { trackEvent } from './ga'
import posthog from './posthog'

export function track(event: string, props?: Record<string, string>) {
  trackEvent(event, props)
  posthog.capture(event, props)
}

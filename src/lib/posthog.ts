import posthog from 'posthog-js'

posthog.init('phc_wHZWGxE4zvgJfWq6s36tQiQ3J858qKRA4fUuGMrdSaQp', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
})

export default posthog

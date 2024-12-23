'use client'

import { GoogleAnalytics } from '@next/third-parties/google'

export function GoogleAnalyticsProvider() {
  // Determine which measurement ID to use based on environment
  const measurementId = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_GA_PROD_ID
    : process.env.NEXT_PUBLIC_GA_DEV_ID

  // Don't render if no measurement ID is configured
  if (!measurementId) {
    console.warn('Google Analytics measurement ID not configured for this environment')
    return null
  }

  return <GoogleAnalytics gaId={measurementId} />
}


/*
EXAMPLE USAGE

'use client'
import { sendGAEvent } from '@next/third-parties/google'

export function TrackableButton() {
  const handleClick = () => {
    sendGAEvent('event', 'button_clicked', {
      category: 'engagement',
      label: 'signup_button',
      value: 1
    })
  }

  return <button onClick={handleClick}>Sign Up</button>
}

*/
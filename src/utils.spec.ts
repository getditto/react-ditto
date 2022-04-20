import { waitFor as libraryWaitFor } from '@testing-library/react'
import { expect } from 'chai'

/** Helper function used to wait for events to sink to the DOM before assertions can be made. */
export const waitFor = (cb: () => boolean, waitMs = 300): Promise<void> => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const result = cb()

      if (result) {
        clearInterval(interval)

        resolve()
      }
    }, waitMs)
  })
}

/**
 * Our own version of `waitForNextUpdate` from `@testing-library/react-hooks`.
 * Based on what's suggested here:
 * https://github.com/testing-library/react-testing-library/pull/991#issuecomment-966325340
 */
export const waitForNextUpdate = async (result: {
  current: unknown
}): Promise<unknown> => {
  const old = result.current
  return libraryWaitFor(() => expect(result.current).not.to.eq(old))
}

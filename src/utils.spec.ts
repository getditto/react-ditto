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

export const waitFor = (cb: () => boolean): Promise<void> => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const result = cb()

      if (result) {
        clearInterval(interval)

        resolve()
      }
    }, 300)
  })
}

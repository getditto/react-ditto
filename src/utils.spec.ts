import { Ditto, DittoConfig, Logger } from '@dittolive/ditto'
import { waitFor as libraryWaitFor } from '@testing-library/react'
import { expect } from 'chai'

/** Tells the provider where to load the locally served `ditto.wasm` file. */
export const wasmInitOptions = {
  webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
}

/** Opens an offline (peer-to-peer only) Ditto instance for use in tests. */
export const openOfflineDitto = (
  databaseID: string,
  persistenceDirectory: string,
): Promise<Ditto> => {
  // The provider has already called `init()` by the time this runs, so it is
  // safe to configure the logger here to keep test output quiet.
  Logger.minimumLogLevel = 'Warning'
  return Ditto.open(
    new DittoConfig(
      databaseID,
      { mode: 'smallPeersOnly' },
      persistenceDirectory,
    ),
  )
}

/** Opens an offline Ditto instance seeded with five `foo` documents. */
export const openSeededDitto = async (
  databaseID: string,
  persistenceDirectory: string,
): Promise<Ditto> => {
  const ditto = await openOfflineDitto(databaseID, persistenceDirectory)
  await ditto.store.execute(
    'INSERT INTO foo DOCUMENTS (:d1), (:d2), (:d3), (:d4), (:d5)',
    {
      d1: { document: 1, category: 1 },
      d2: { document: 2, category: 2 },
      d3: { document: 3 },
      d4: { document: 4 },
      d5: { document: 5 },
    },
  )
  return ditto
}

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

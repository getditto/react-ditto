import { Ditto } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoLazyProvider, DittoProvider, useDitto } from './'
import { openOfflineDitto, wasmInitOptions } from './utils.spec'

const testConfig: () => {
  databaseID: string
  persistenceDirectory: string
} = () => ({
  databaseID: 'useDittoSpec',
  persistenceDirectory: uuidv4(),
})

describe('useDittoSpec tests', function () {
  it('should return a ditto instance with a matching persistence directory when a non-lazy provider is used.', async function () {
    const testConfiguration = testConfig()
    const setup = (): Promise<Ditto> =>
      openOfflineDitto(
        testConfiguration.databaseID,
        testConfiguration.persistenceDirectory,
      )

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider setup={setup} initOptions={wasmInitOptions}>
        {() => {
          return children
        }}
      </DittoProvider>
    )
    const { result } = renderHook(
      () => useDitto(testConfiguration.persistenceDirectory),
      {
        wrapper,
      },
    )

    await waitFor(() => expect(result.current.ditto).to.exist, {
      timeout: 5000,
    })
    expect(result.current.ditto.config.persistenceDirectory).to.eq(
      testConfiguration.persistenceDirectory,
    )
  })

  it('should return a ditto instance with a matching persistenceDirectory, and a loading state, when a lazy provider is used.', async function () {
    const testConfiguration = testConfig()
    const setup = (): Promise<Ditto> =>
      openOfflineDitto(
        testConfiguration.databaseID,
        testConfiguration.persistenceDirectory,
      )

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoLazyProvider setup={setup} initOptions={wasmInitOptions}>
        {({ loading }) => {
          if (loading) {
            return null
          }
          return children
        }}
      </DittoLazyProvider>
    )
    const { result, rerender } = renderHook(
      () => useDitto(testConfiguration.persistenceDirectory),
      {
        wrapper,
      },
    )

    await waitFor(
      () => {
        rerender()
        expect(result.current.loading).to.be.false
        expect(result.current.ditto).to.exist
      },
      { timeout: 5000 },
    )

    expect(result.current?.ditto.config.persistenceDirectory).to.eq(
      testConfiguration.persistenceDirectory,
    )
    expect(result.current?.loading).to.eq(false)
    expect(result.current?.error).to.eq(undefined)
  })
})

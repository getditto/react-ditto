import { Ditto, IdentityDevelopment } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode } from 'react'

import { DittoProvider, useDitto } from './'

const identity: IdentityDevelopment = {
  appName: 'live.ditto.test',
  siteID: 234,
  type: 'development',
}

describe('useDittoSpec tests', function () {
  it('should return a ditto instance with a matching path variable', async function () {
    const setup = (): Ditto => {
      const ditto = new Ditto(identity, '/test')
      return ditto
    }

    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider setup={setup} initOptions={initOptions}>
        {() => {
          return children
        }}
      </DittoProvider>
    )
    const { result, waitFor } = renderHook(() => useDitto('/test'), {
      wrapper,
    })

    await waitFor(() => !!result.current?.ditto, { timeout: 5000 })
    expect(result.current?.ditto?.path).to.eq('/test')
  })
})

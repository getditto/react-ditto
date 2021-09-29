import { Ditto, IdentityDevelopment } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode } from 'react'
import { unmountComponentAtNode } from 'react-dom'

import { DittoProvider, useDitto } from './'

const identity: IdentityDevelopment = {
  appName: 'live.ditto.test',
  siteID: 234,
  type: 'development',
}

describe('useDittoSpec tests', function () {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    unmountComponentAtNode(container)
    container.remove()
    container = null
  })

  it('should return a ditto instance with a matching path variable', async function () {
    const setup = (): Ditto => {
      const ditto = new Ditto(identity, '/test')
      return ditto
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider setup={setup}>
        {() => {
          return children
        }}
      </DittoProvider>
    )
    const { result, waitFor } = renderHook(() => useDitto('/test'), {
      wrapper,
    })

    await waitFor(() => !!result.current?.ditto, { timeout: 2000 })

    expect(result.current?.ditto?.path).to.eq('/test')
  })
})

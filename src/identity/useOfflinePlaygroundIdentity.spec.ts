import { renderHook } from '@testing-library/react'
import { expect } from 'chai'

import { useOfflinePlaygroundIdentity } from './useOfflinePlaygroundIdentity'

describe('Ditto useDevelopmentIdentity hook tests', () => {
  it('should correctly create a development identity', () => {
    const { result } = renderHook(() => useOfflinePlaygroundIdentity())

    expect(result.current.create).to.exist

    const identity = result.current.create({ appName: 'my-app', siteID: 1234 })

    expect(identity).to.eql({
      type: 'offlinePlayground',
      appName: 'my-app',
      siteID: 1234,
    })
  })
})

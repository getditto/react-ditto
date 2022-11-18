import { renderHook } from '@testing-library/react'
import { expect } from 'chai'
import { v4 as uuidv4 } from 'uuid'

import { useOnlinePlaygroundIdentity } from './useOnlinePlaygroundIdentity'

describe('Ditto useOnlinePlaygroundIdentity hook tests', () => {
  it('should correctly create an onlinePlayground identity', () => {
    const appID = uuidv4()

    const { result } = renderHook(() => useOnlinePlaygroundIdentity())

    expect(result.current.create).to.exist

    const identity = result.current.create({
      appID: appID,
      token: 'my-token',
    })

    expect(identity).to.eql({
      type: 'onlinePlayground',
      appID: appID,
      token: 'my-token',
      customAuthURL: undefined,
      enableDittoCloudSync: undefined,
    })
  })
})

import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'

import { useDevelopmentIdentity } from './useDevelopmentIdentity'

describe('Ditto useDevelopmentIdentity hook tests', () => {
  it('should correctly create a development identity', () => {
    const { result } = renderHook(() => useDevelopmentIdentity())

    expect(result.current.create).to.exist

    const identity = result.current.create({ appName: 'my-app', siteID: 1234 })

    expect(identity).to.eql({
      type: 'development',
      appName: 'my-app',
      siteID: 1234,
    })
  })
})

import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from './useMutations'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appID: 'useMutationsSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

describe('useMutations tests', function () {
  const collection = 'collection'

  it('should correctly create a new entity inside of a collection and update it by ID', async () => {
    const testConfiguration = testIdentity()
    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider
        setup={() => {
          const ditto = new Ditto(
            testConfiguration.identity,
            testConfiguration.path,
          )
          return ditto
        }}
        initOptions={initOptions}
      >
        {() => {
          return children
        }}
      </DittoProvider>
    )

    const params = { path: testConfiguration.path, collection }
    const { result: mutations } = renderHook(() => useMutations(params), {
      wrapper,
    })
    await waitFor(() => expect(mutations.current.ditto).to.exist)

    const upsertResult = await mutations.current.upsert({
      value: { _id: 'some_id', foo: 'bar' },
    })

    expect(upsertResult.value).to.eql('some_id')

    const updateResult = await mutations.current.updateByID({
      _id: 'some_id',
      updateClosure: (doc) => doc.at('foo').set('updated'),
    })

    expect(updateResult.length).to.eq(1)
    expect(updateResult[0].type).to.eq('set')
    expect(updateResult[0].path).to.eql('foo')
    expect(updateResult[0].value).to.eql('updated')
  })

  it('should correctly create multiple documents inside of a collection and update them using a query', async () => {
    const testConfiguration = testIdentity()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider
        setup={() => {
          const ditto = new Ditto(
            testConfiguration.identity,
            testConfiguration.path,
          )
          return ditto
        }}
      >
        {() => {
          return children
        }}
      </DittoProvider>
    )

    const params = { path: testConfiguration.path, collection }
    const { result: mutations } = renderHook(() => useMutations(params), {
      wrapper,
    })

    await waitFor(() => expect(mutations.current.ditto).to.exist)

    await mutations.current.upsert({
      value: { _id: 'car', type: 'car', wheels: 4 },
    })
    await mutations.current.upsert({
      value: { _id: 'skate', type: 'skate', wheels: 4 },
    })
    await mutations.current.upsert({
      value: { _id: 'bike', type: 'bike', wheels: 2 },
    })

    const updateResult = await mutations.current.update({
      query: 'wheels > 2',
      updateClosure: (docs) => docs[0].at('wheels').set(0),
    })

    expect(updateResult.keys().length).to.eq(2)

    updateResult.keys().forEach((key) => {
      expect(key).not.to.eq('bike')
      // Comment these back in once https://github.com/getditto/ditto/issues/4242 is fixed
      // expect(updateResult.get(key).length).to.eq(1)
      // expect(updateResult.get(key)[0].type).to.eq('set')
      // expect(updateResult.get(key)[0].path).to.eql('wheels')
      // expect(updateResult.get(key)[0].value).to.eql(0)
    })
  })
})

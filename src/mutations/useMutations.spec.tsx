/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode } from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from './useMutations'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appName: 'useMutationsSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

describe('useMutations tests', function () {
  let container: HTMLDivElement
  const collection = 'collection'

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    unmountComponentAtNode(container)
    container.remove()
    container = null
  })

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
    const { result: mutations, waitFor: waitForMutations } = renderHook(
      () => useMutations<unknown>(params),
      {
        wrapper,
      },
    )
    await waitForMutations(() => !!mutations.current.ditto)

    const insertResult = await mutations.current.insert({
      value: { foo: 'bar' },
      insertOptions: { id: 'some_id' },
    })

    // @ts-ignore
    expect(insertResult!.toString()).to.eql('"some_id"')

    const updateResult = await mutations.current.updateByID({
      _id: 'some_id',
      updateClosure: (doc: any) => (doc.foo = 'updated'),
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
    const { result: mutations, waitFor: waitForMutations } = renderHook(
      () => useMutations<unknown>(params),
      {
        wrapper,
      },
    )

    await waitForMutations(() => !!mutations.current.ditto)

    await mutations.current.insert({
      value: { type: 'car', wheels: 4 },
      insertOptions: { id: 'car' },
    })
    await mutations.current.insert({
      value: { type: 'skate', wheels: 4 },
      insertOptions: { id: 'skate' },
    })
    await mutations.current.insert({
      value: { type: 'bike', wheels: 2 },
      insertOptions: { id: 'bike' },
    })

    const updateResult = await mutations.current.update({
      query: 'wheels > 2',
      updateClosure: (doc: any) => (doc.wheels = 0),
    })

    expect(updateResult.keys().length).to.eq(2)

    updateResult.keys().forEach((key) => {
      expect(key.toString()).not.to.eq('"bike"')
      // Comment these back in once https://github.com/getditto/ditto/issues/4242 is fixed
      // expect(updateResult.get(key).length).to.eq(1)
      // expect(updateResult.get(key)[0].type).to.eq('set')
      // expect(updateResult.get(key)[0].path).to.eql('wheels')
      // expect(updateResult.get(key)[0].value).to.eql(0)
    })
  })
})

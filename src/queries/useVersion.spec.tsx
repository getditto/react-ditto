import { renderHook } from '@testing-library/react'
import { expect } from 'chai'

import { useVersion } from './useVersion'

describe('useVersion helper hook', () => {
  it('should render version 0 for the initial version of the params passed to the hook', function () {
    const { result } = renderHook(() =>
      useVersion({
        foo: {
          bar: 1,
          other: { foo: 'bla' },
        },
      }),
    )

    expect(result.current).to.eq(0)
  })

  it('should correctly bump up the version number each time the hook value changes', function () {
    const { result, rerender } = renderHook<number, unknown>(
      (hookProps) => useVersion(hookProps),
      {
        initialProps: {
          foo: {
            bar: 1,
            other: { foo: 'bla' },
          },
        },
      },
    )

    expect(result.current).to.eq(0)

    rerender({
      foo: {
        other: { foo: 'bla' },
      },
    })

    expect(result.current).to.eq(1)

    rerender({
      foo: 1,
    })

    expect(result.current).to.eq(2)
  })

  it('should not bump up the hook version when the hook is rendered with params that are deeply equal', () => {
    const { result, rerender } = renderHook<number, unknown>(
      (hookProps) => useVersion(hookProps),
      {
        initialProps: {
          foo: {
            bar: 1,
            other: { foo: 'bla' },
          },
        },
      },
    )

    expect(result.current).to.eq(0)

    rerender({
      foo: {
        bar: 1,
        other: { foo: 'bla' },
      },
    })

    expect(result.current).to.eq(0)

    rerender({
      foo: {
        bar: 1,
        other: { foo: 'bla' },
      },
    })

    expect(result.current).to.eq(0)
  })
})

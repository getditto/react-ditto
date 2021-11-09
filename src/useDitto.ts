import { Ditto } from '@dittolive/ditto'
import { useContext, useEffect, useState } from 'react'

import { DittoContext } from '.'

export interface DittoHookProps {
  ditto: Ditto | null
  loading: boolean
  error: Error | undefined
}

export const useDitto = (path: string | null | undefined): DittoHookProps => {
  const { dittoHash, isLazy, load } = useContext(DittoContext)
  const [loading, setLoading] = useState(isLazy && !(path in dittoHash))
  const [error, setError] = useState<Error>()
  const ditto = !!path ? dittoHash[path] : Object.values(dittoHash)[0]

  useEffect(() => {
    async function lazyLoadDitto() {
      if (!ditto && path) {
        setLoading(true)
        try {
          await load(path)
        } catch (loadError) {
          setError(loadError)
        } finally {
          setLoading(false)
        }
      }
    }

    if (isLazy) {
      lazyLoadDitto()
    }
  }, [ditto, isLazy, path])

  return { loading, error, ditto }
}

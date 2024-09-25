import { Ditto } from '@dittolive/ditto'
import { useEffect, useState } from 'react'

import { useDittoContext } from './index.js'

export interface DittoHookProps {
  ditto: Ditto | null
  loading: boolean
  error: Error | undefined
}

export const useDitto = (path: string | null | undefined): DittoHookProps => {
  const { dittoHash, isLazy, load } = useDittoContext()
  const [loading, setLoading] = useState(isLazy && !(path in dittoHash))
  const [error, setError] = useState<Error>()
  const ditto = path ? dittoHash[path] : Object.values(dittoHash)[0]

  useEffect(() => {
    async function lazyLoadDitto() {
      if (!ditto && path) {
        setLoading(true)
        try {
          await load(path)
        } catch (loadError: unknown) {
          if (loadError instanceof Error) {
            setError(loadError)
          } else {
            throw loadError
          }
        } finally {
          setLoading(false)
        }
      }
    }

    if (isLazy) {
      lazyLoadDitto()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ditto, isLazy, path])

  return { loading, error, ditto }
}

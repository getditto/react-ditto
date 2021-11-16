import { isEqual } from 'lodash'
import { useEffect, useRef, useState } from 'react'

/**
 * Hook used to return the version number of a value used inside a React Hook. Tracks changes in the value
 * by performing a deep comparison between the current value and previous value, and returns a version number that
 * can be handed over to a list of useEffect dependencies.
 */
export const useVersion = <T>(value: T) => {
  const valueRef = useRef<T>(value)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!isEqual(valueRef.current, value)) {
      valueRef.current = value
      setVersion((currentVersion) => currentVersion + 1)
    }
  }, [value])

  return version
}

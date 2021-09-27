import {
  Authenticator,
  IdentityDevelopment,
  IdentityOnline,
} from '@dittolive/ditto'
import { useRef, useState } from 'react'

/**
 * @example

 * ```js
 *
 * const { development } = useIdentity();
 *
 * const myIdentity = development({appName: 'my-app', siteID: 1234});
 * const ditto = new Ditto(myIdentity, '/path');
 *
 * const { online, authenticate, isAuthenticationRequired, tokenExpiresInSeconds } = useIdentity();
 *
 * const onlineIdentity = development({appID: uuid(), enableDittoCloudSync: true});
 * const ditto = new Ditto(enableDittoCloudSync, '/path');
 *
 * ...
 * ...
 *
 * return <button onClick={() => authenticate('my-token', 'my-provider')}>Authenticate</button>
 *
 * A hook for creating Ditto identity objects.
 */
export const useDittoIdentity = () => {
  const [isAuthenticationRequired, setIsAuthenticationRequired] =
    useState(false)
  const [tokenExpiresInSeconds, setTokenExpiresInSeconds] = useState<number>()
  const authenticatorRef = useRef<Authenticator>()

  const development = ({
    appName,
    siteID,
  }: {
    appName: string
    siteID: number | BigInt
  }): IdentityDevelopment => {
    return {
      appName,
      siteID,
      type: 'development',
    } as IdentityDevelopment
  }

  const online = ({
    appID,
    enableDittoCloudSync,
    customAuthURL,
  }: {
    appID: string
    enableDittoCloudSync?: boolean
    customAuthURL?: string
  }) => {
    return {
      type: 'online',
      appID,
      enableDittoCloudSync,
      customAuthURL,
      authHandler: {
        authenticationRequired: (authenticator) => {
          authenticatorRef.current = authenticator
          setIsAuthenticationRequired(true)
        },
        authenticationExpiringSoon: (authenticator, tokenExpiresInSeconds) => {
          authenticatorRef.current = authenticator
          setTokenExpiresInSeconds(tokenExpiresInSeconds)
        },
      },
    } as IdentityOnline
  }

  return {
    development,
    online,
    isAuthenticationRequired,
    tokenExpiresInSeconds,
    authenticate: (token: string, provider: string) => {
      return authenticatorRef.current?.loginWithToken(token, provider)
    },
  }
}

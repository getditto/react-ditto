import { Authenticator, IdentityOnline } from '@dittolive/ditto'
import { useRef, useState } from 'react'

/**
 * @example

 * ```js
 **
 * const { create, authenticate, isAuthenticationRequired, tokenExpiresInSeconds } = useOnlineIdentity();
 *
 * const onlineIdentity = create({appID: uuid(), enableDittoCloudSync: true});
 * const ditto = new Ditto(onlineIdentity, '/path');
 *
 * ...
 * ...
 *
 * return <button onClick={() => authenticate('my-token', 'my-provider')}>Authenticate</button>
 *
 * A hook for creating OnlineDitto identity objects.
 */
export const useOnlineIdentity = () => {
  const [isAuthenticationRequired, setIsAuthenticationRequired] =
    useState(false)
  const [tokenExpiresInSeconds, setTokenExpiresInSeconds] = useState<number>()
  const authenticatorRef = useRef<Authenticator>()

  const create = ({
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
    create,
    isAuthenticationRequired,
    tokenExpiresInSeconds,
    authenticate: (token: string, provider: string) => {
      return authenticatorRef.current?.loginWithToken(token, provider)
    },
  }
}

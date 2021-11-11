import {
  Authenticator,
  IdentityOnlineWithAuthentication,
} from '@dittolive/ditto'
import { useState } from 'react'

export interface CreateOnlineIdentityParams {
  appID: string
  enableDittoCloudSync?: boolean
  customAuthURL?: string
}

export interface useOnlineIdentityProps {
  /**
   * Function used for creating a new online identity. Will save an internal reference to the identity inside of the
   * hook in order to manage the authentication state for the identity.
   * */
  create: (
    params: CreateOnlineIdentityParams,
    path: string,
  ) => IdentityOnlineWithAuthentication
  /**
   * Retrieves the authentication required state for any of the identities created with the hook.
   * */
  getAuthenticationRequired: (forPath: string) => boolean
  /**
   * Retrieves the token expiration time for an identity if one has been notified by the SDK, for any identity created with
   * the hook.
   * */
  getTokenExpiresInSeconds: (forPath: string) => number | null
  /** Function used to authenticate for any identity created with the hook where authentication is required. Updates
   * the internal authentication required state if auth succeeds. */
  authenticate: (
    forPath: string,
    provider: string,
    token: string,
  ) => Promise<void>
}

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
 * @returns useOnlineIdentityProps
 */
export const useOnlineIdentity = (): useOnlineIdentityProps => {
  // Auth required booleans, indexed by the instance paths
  const [authenticationRequired, setAuthenticationRequired] = useState<{
    [path: string]: Authenticator
  }>({})
  // Auth expiring booleans, indexed by the instance paths
  const [authenticationExpiringSoon, setAuthenticationExpiringSoon] = useState<{
    [path: string]: {
      authenticator: Authenticator
      tokenExpiresInSeconds: number
    }
  }>({})

  const create = (
    { appID, enableDittoCloudSync, customAuthURL }: CreateOnlineIdentityParams,
    path: string,
  ) => {
    return {
      type: 'onlineWithAuthentication',
      appID,
      enableDittoCloudSync,
      customAuthURL,
      authHandler: {
        authenticationRequired: (authenticator) => {
          setAuthenticationRequired((currentAuthRequired) => ({
            ...currentAuthRequired,
            [path]: authenticator,
          }))
        },
        authenticationExpiringSoon: (authenticator, tokenExpiresInSeconds) => {
          setAuthenticationExpiringSoon((currentAuthExpiringSoon) => ({
            ...currentAuthExpiringSoon,
            [path]: { authenticator, tokenExpiresInSeconds },
          }))
        },
      },
    } as IdentityOnlineWithAuthentication
  }

  const getAuthenticationRequired = (forPath: string) => {
    return forPath in authenticationRequired
  }

  const getTokenExpiresInSeconds = (forPath: string) => {
    return forPath in authenticationExpiringSoon
      ? authenticationExpiringSoon[forPath].tokenExpiresInSeconds
      : null
  }

  const authenticate = (
    forPath: string,
    provider: string,
    token: string,
  ): Promise<void> => {
    if (forPath in authenticationRequired) {
      const authenticator = authenticationRequired[forPath]

      return authenticator.loginWithToken(token, provider).then(() =>
        setAuthenticationRequired((currentAuthRequired) => {
          const nextAuthRequired = Object.keys(currentAuthRequired).reduce(
            (acc, path) => {
              if (path === forPath) {
                return acc
              }

              return { ...acc, [path]: currentAuthRequired[path] }
            },
            {},
          )

          return nextAuthRequired
        }),
      )
    }

    return Promise.resolve()
  }

  return {
    create,
    getAuthenticationRequired,
    getTokenExpiresInSeconds,
    authenticate,
  }
}

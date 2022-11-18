import { IdentityOnlineWithAuthentication } from '@dittolive/ditto'
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
}

/**
 * @example

 * ```js
 * const { create, isAuthenticationRequired, tokenExpiresInSeconds } = useOnlineIdentity();
 *
 * const onlineIdentity = create({appID: uuid(), enableDittoCloudSync: true});
 * const ditto = new Ditto(onlineIdentity, '/path');
 *
 * ...
 * ...
 *
 * return <button onClick={() => ditto.auth.loginWithToken('my-token', 'my-provider')}>Authenticate</button>
 * ```
 * 
 * A hook for creating OnlineDitto identity objects. For creating OnlinePlayground identities, 
 * use `{@link useOnlinePlaygroundIdentity}` instead.
 * @returns useOnlineIdentityProps
 */
export const useOnlineIdentity = (): useOnlineIdentityProps => {
  // Auth required booleans, indexed by the instance paths
  const [authenticationRequired, setAuthenticationRequired] = useState<{
    [path: string]: boolean
  }>({})
  // Auth expiring booleans, indexed by the instance paths
  const [authenticationExpiringSoon, setAuthenticationExpiringSoon] = useState<{
    [path: string]: number
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
        authenticationRequired: () => {
          setAuthenticationRequired((currentAuthRequired) => ({
            ...currentAuthRequired,
            [path]: true,
          }))
        },
        authenticationExpiringSoon: (authenticator, tokenExpiresInSeconds) => {
          setAuthenticationExpiringSoon((currentAuthExpiringSoon) => ({
            ...currentAuthExpiringSoon,
            [path]: tokenExpiresInSeconds,
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
      ? authenticationExpiringSoon[forPath]
      : null
  }

  return {
    create,
    getAuthenticationRequired,
    getTokenExpiresInSeconds,
  }
}

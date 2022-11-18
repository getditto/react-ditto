import { IdentityOnlinePlayground } from '@dittolive/ditto'

export interface CreateOnlinePlaygroundIdentityParams {
  appID: string
  token: string
  enableDittoCloudSync?: boolean
  customAuthURL?: string
}

export interface useOnlinePlaygroundIdentityProps {
  /**
   * Function used for creating a new online playground identity.
   * */
  create: (
    params: CreateOnlinePlaygroundIdentityParams,
  ) => IdentityOnlinePlayground
}

/**
 * @example
 * ```js
 * const { create } = useOnlinePlaygroundIdentity();
 *
 * const myIdentity = create({appId: uuid(), token: 'my-token'});
 * const ditto = new Ditto(myIdentity, '/path');
 * ```
 *
 * A hook for creating OnlinePlayground Ditto identity objects.
 * @returns useOnlinePlaygroundIdentityProps
 */
export const useOnlinePlaygroundIdentity =
  (): useOnlinePlaygroundIdentityProps => {
    return {
      create: ({
        appID,
        token,
        enableDittoCloudSync,
        customAuthURL,
      }: CreateOnlinePlaygroundIdentityParams): IdentityOnlinePlayground => {
        return {
          type: 'onlinePlayground',
          appID,
          token,
          enableDittoCloudSync,
          customAuthURL,
        }
      },
    }
  }
